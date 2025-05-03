import "./App.css";
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BannerService,
  Banner,
  BannerLocalMemory,
  pageSize,
} from "./services/bannerService";
import "bootstrap/dist/css/bootstrap.min.css";
import HomeView from "./components/HomeView";
import ViewView from "./components/ViewView";
import ModifyView from "./components/ModifyView";
import AddView from "./components/AddView";

type View = "home" | "add" | "view" | "modify";

function useHasScrolledToBottom(): boolean {
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10;

      setIsBottom(scrolledToBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isBottom;
}

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await invoke<boolean>("check_network");
        setIsOnline(result);
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return isOnline;
}

function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [releaseDay, setReleaseDay] = useState("");
  const [releaseTime, setReleaseTime] = useState("12:00");
  const [imageFile, setBannerImage] = useState<Blob | null>(null);
  const [currentEpisodes, setCurrentEpisodes] = useState<number>(0);
  const [totalEpisodes, setTotalEpisodes] = useState<number>(0);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const isBottom = useHasScrolledToBottom();
  const isOnline = useNetworkStatus();
  const bannerServiceRef = useRef<BannerService | BannerLocalMemory>(
    isOnline ? new BannerService() : new BannerLocalMemory()
  );

  const resetBanners = async () => {
    if (bannerServiceRef.current instanceof BannerLocalMemory) return;
    setBanners([]);
    setPageCount(0);
    setHasMore(true);
  };

  useEffect(() => {
    if (isOnline) {
      const remoteService = new BannerService();
      if (bannerServiceRef.current instanceof BannerLocalMemory) {
        const change_log = bannerServiceRef.current.getChangeLog();
        remoteService.syncServer(change_log);
      }
      bannerServiceRef.current = remoteService;
    } else {
      const localService = new BannerLocalMemory();
      if (bannerServiceRef.current instanceof BannerService) {
        localService.cacheBanners(banners);
        bannerServiceRef.current = localService;
      }
    }
  });

  useEffect(() => {
    if (currentView === "view" || currentView === "modify") {
      if (banners.length === 0) {
        loadBanners();
      } else if (isBottom) {
        loadBanners();
      }
    } else {
      resetBanners();
    }
  }, [isBottom, currentView]);

  const reloadBanners = async (bannerCount: number) => {
    const updatedPageCount = Math.ceil(bannerCount / pageSize);
    setPageCount(updatedPageCount);
    setBanners([]);
    for (let i = 0; i < updatedPageCount; i++) {
      const newBanners = await bannerServiceRef.current.getPagedBanners(i);
      setBanners((prev) => [...prev, ...newBanners]);
    }
  };

  const loadBanners = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    let newBanners: Banner[];

    if (searchText.trim() === "") {
      newBanners = await bannerServiceRef.current.getPagedBanners(pageCount);
    } else {
      newBanners = await bannerServiceRef.current.searchBanners(
        searchText,
        pageCount
      );
    }

    if (newBanners.length === 0) {
      setHasMore(false);
    } else {
      setPageCount(pageCount + 1);
      setBanners((prev) => [...prev, ...newBanners]);
    }
    setIsLoading(false);
  };

  const blobToBinary = (blob: Blob): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(blob);
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(Array.from(new Uint8Array(reader.result)));
        } else {
          reject(new Error("Failed to convert Blob to byte array"));
        }
      };
      reader.onerror = reject;
    });
  };

  const handleAddBanner = async () => {
    try {
      const bytes = await blobToBinary(imageFile!);

      await bannerServiceRef.current.addBanner({
        image_binary: bytes,
        title: title,
        release_day: releaseDay,
        release_time: releaseTime,
        current_episodes: currentEpisodes,
        total_episodes: totalEpisodes,
      });
      let new_banners = await bannerServiceRef.current.getAllBanners();
      setBanners(new_banners);
      setTitle("");
      setReleaseDay("");
      setReleaseTime("12:00");
      setBannerImage(null);
      setCurrentEpisodes(0);
      setTotalEpisodes(0);
      setCurrentView("home");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add banner");
    }
  };
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    resetBanners();
    loadBanners();
    // console.log("search");
  }, [searchText]);

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  const handleDeleteBanner = (banner: Banner) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      bannerServiceRef.current.deleteBanner(banner.title);
      // loadBanners();
      reloadBanners(banners.length - 1);
    }
  };

  const handleUpdateCurrentEpisodes = async (
    id: string,
    current_episodes: number
  ) => {
    bannerServiceRef.current.updateCurrentEpisodes(id, current_episodes);
    let new_banners = await bannerServiceRef.current.getAllBanners();
    setBanners(new_banners);
  };

  const handleUpdateTotalEpisodes = async (
    id: string,
    total_episodes: number
  ) => {
    bannerServiceRef.current.updateTotalEpisodes(id, total_episodes);
    let new_banners = await bannerServiceRef.current.getAllBanners();
    setBanners(new_banners);
  };

  const handleUpdateReleaseDay = async (id: string, release_day: string) => {
    bannerServiceRef.current.updateReleaseDay(id, release_day);
    let new_banners = await bannerServiceRef.current.getAllBanners();
    setBanners(new_banners);
  };

  const handleUpdateReleaseTime = async (id: string, release_time: string) => {
    bannerServiceRef.current.updateReleaseTime(id, release_time);
    let new_banners = await bannerServiceRef.current.getAllBanners();
    setBanners(new_banners);
  };

  // const renderHomeView = () => (
  //   <div
  //     className="d-flex flex-column gap-3 align-items-center justify-content-center"
  //     style={{ minHeight: "80vh" }}
  //   >
  //     <button
  //       onClick={() => handleViewChange("add")}
  //       className="btn btn-primary btn-lg w-50"
  //     >
  //       Add New Banner
  //     </button>
  //     <button
  //       onClick={() => handleViewChange("view")}
  //       className="btn btn-info btn-lg w-50"
  //     >
  //       View All Banners
  //     </button>
  //     <button
  //       onClick={() => handleViewChange("modify")}
  //       className="btn btn-warning btn-lg w-50"
  //     >
  //       Modify Banners
  //     </button>
  //   </div>
  // );

  // const renderAddView = () => (
  //   <div className="container">
  //     <div className="d-flex justify-content-between align-items-center mb-4">
  //       <h2>Add New Banner</h2>
  //       <button
  //         onClick={() => handleViewChange("home")}
  //         className="btn btn-secondary"
  //       >
  //         Back to Home
  //       </button>
  //     </div>
  //     <div className="d-flex flex-column gap-3">
  //       <div className="mb-3">
  //         <label className="form-label">Title</label>
  //         <input
  //           type="text"
  //           placeholder="Enter title"
  //           value={title}
  //           onChange={(e) => setTitle(e.target.value)}
  //           className="form-control"
  //         />
  //       </div>
  //       <div className="mb-3">
  //         <label className="form-label">Release Day</label>
  //         <select
  //           value={releaseDay}
  //           onChange={(e) => setReleaseDay(e.target.value)}
  //           className="form-select"
  //         >
  //           <option value="">Select a day</option>
  //           {DAYS_OF_WEEK.map((day) => (
  //             <option key={day} value={day}>
  //               {day}
  //             </option>
  //           ))}
  //         </select>
  //       </div>
  //       <div className="mb-3">
  //         <label className="form-label">Release Time</label>
  //         <input
  //           type="time"
  //           value={releaseTime}
  //           onChange={(e) => setReleaseTime(e.target.value)}
  //           className="form-control"
  //         />
  //       </div>
  //       <div className="row">
  //         <div className="col">
  //           <div className="mb-3">
  //             <label className="form-label">Current Episodes</label>
  //             <input
  //               type="number"
  //               value={currentEpisodes}
  //               onChange={(e) => setCurrentEpisodes(Number(e.target.value))}
  //               className="form-control"
  //               min="0"
  //             />
  //           </div>
  //         </div>
  //         <div className="col">
  //           <div className="mb-3">
  //             <label className="form-label">Total Episodes</label>
  //             <input
  //               type="number"
  //               value={totalEpisodes}
  //               onChange={(e) => setTotalEpisodes(Number(e.target.value))}
  //               className="form-control"
  //               min="0"
  //             />
  //           </div>
  //         </div>
  //       </div>
  //       <div className="mb-3">
  //         <label className="form-label">Banner Image</label>
  //         <input
  //           type="file"
  //           accept="image/*"
  //           onChange={(e) => {
  //             if (e.target.files) setBannerImage(e.target.files[0]);
  //           }}
  //           className="form-control"
  //         />
  //       </div>
  //       <button onClick={handleAddBanner} className="btn btn-primary">
  //         Add Banner
  //       </button>
  //     </div>
  //   </div>
  // );

  // const renderViewView = () => (
  //   <div className="container">
  //     <div className="d-flex justify-content-between align-items-center mb-4">
  //       <h2>All Banners</h2>
  //       <button
  //         onClick={() => handleViewChange("home")}
  //         className="btn btn-secondary"
  //       >
  //         Back to Home
  //       </button>
  //     </div>
  //     <div className="mb-4">
  //       <input
  //         type="text"
  //         placeholder="Search by title"
  //         value={searchText}
  //         onChange={(e) => setSearchText(e.target.value)}
  //         className="form-control"
  //       />
  //     </div>
  //     <div className="row row-cols-auto g-2">
  //       {banners.map((banner, index) => (
  //         <div key={index} className="col px-2">
  //           <InfoBanner
  //             imageFile={
  //               new Blob([new Uint8Array(banner.image_binary)], {
  //                 type: "image/png",
  //               })
  //             }
  //             title={banner.title}
  //             releaseDay={banner.release_day}
  //             releaseTime={banner.release_time}
  //             currentEpisodes={banner.current_episodes}
  //             totalEpisodes={banner.total_episodes}
  //           />
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  // const renderModifyView = () => (
  //   <div className="container">
  //     <div className="d-flex justify-content-between align-items-center mb-4">
  //       <h2>Modify Banners</h2>
  //       <button
  //         onClick={() => handleViewChange("home")}
  //         className="btn btn-secondary"
  //       >
  //         Back to Home
  //       </button>
  //     </div>
  //     <div className="mb-4">
  //       <input
  //         type="text"
  //         placeholder="Search by title"
  //         value={searchText}
  //         onChange={(e) => setSearchText(e.target.value)}
  //         className="form-control"
  //       />
  //     </div>
  //     <div className="d-flex flex-column gap-4">
  //       {banners.map((banner) => (
  //         <div key={banner.title} className="card">
  //           <div className="card-body bg-secondary">
  //             <div className="row">
  //               <div className="col-md-6">
  //                 <InfoBanner
  //                   imageFile={
  //                     new Blob([new Uint8Array(banner.image_binary)], {
  //                       type: "image/png",
  //                     })
  //                   }
  //                   title={banner.title}
  //                   releaseDay={banner.release_day}
  //                   releaseTime={banner.release_time}
  //                   currentEpisodes={banner.current_episodes}
  //                   totalEpisodes={banner.total_episodes}
  //                 />
  //               </div>
  //               <div className="col-md-6">
  //                 <div className="d-flex flex-column gap-2">
  //                   <div className="mb-3">
  //                     <label className="form-label">Current Episodes</label>
  //                     <input
  //                       type="number"
  //                       min="0"
  //                       className="form-control"
  //                       value={banner.current_episodes}
  //                       onChange={(e) =>
  //                         handleUpdateCurrentEpisodes(
  //                           banner.title,
  //                           parseInt(e.target.value)
  //                         )
  //                       }
  //                     />
  //                   </div>
  //                   <div className="mb-3">
  //                     <label className="form-label">Total Episodes</label>
  //                     <input
  //                       type="number"
  //                       min="0"
  //                       className="form-control"
  //                       value={banner.total_episodes}
  //                       onChange={(e) =>
  //                         handleUpdateTotalEpisodes(
  //                           banner.title,
  //                           parseInt(e.target.value)
  //                         )
  //                       }
  //                     />
  //                   </div>
  //                   <div className="mb-3">
  //                     <label className="form-label">Release Day</label>
  //                     <select
  //                       className="form-select"
  //                       value={banner.release_day}
  //                       onChange={(e) =>
  //                         handleUpdateReleaseDay(banner.title, e.target.value)
  //                       }
  //                     >
  //                       {DAYS_OF_WEEK.map((day) => (
  //                         <option key={day} value={day}>
  //                           {day}
  //                         </option>
  //                       ))}
  //                     </select>
  //                   </div>
  //                   <div className="mb-3">
  //                     <label className="form-label">Release Time</label>
  //                     <input
  //                       type="time"
  //                       className="form-control"
  //                       value={banner.release_time}
  //                       onChange={(e) =>
  //                         handleUpdateReleaseTime(banner.title, e.target.value)
  //                       }
  //                     />
  //                   </div>
  //                   <button
  //                     className="btn btn-danger"
  //                     onClick={() => handleDeleteBanner(banner)}
  //                   >
  //                     Delete Banner
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">
        Track Anime {isOnline ? "" : "(Offline Mode)"}
      </h1>
      {currentView === "home" && (
        <HomeView handleViewChange={handleViewChange}></HomeView>
      )}
      {currentView === "add" && (
        <AddView
          title={title}
          releaseDay={releaseDay}
          releaseTime={releaseTime}
          currentEpisodes={currentEpisodes}
          totalEpisodes={totalEpisodes}
          handleViewChange={handleViewChange}
          setTitle={setTitle}
          setReleaseDay={setReleaseDay}
          setReleaseTime={setReleaseTime}
          setCurrentEpisodes={setCurrentEpisodes}
          setTotalEpisodes={setTotalEpisodes}
          handleAddBanner={handleAddBanner}
          setBannerImage={setBannerImage}
        ></AddView>
      )}
      {currentView === "view" && (
        <ViewView
          handleViewChange={handleViewChange}
          searchText={searchText}
          banners={banners}
          searchTextChange={setSearchText}
        ></ViewView>
      )}
      {currentView === "modify" && (
        <ModifyView
          handleUpdateTotalEpisodes={handleUpdateTotalEpisodes}
          searchTextChange={setSearchText}
          handleViewChange={handleViewChange}
          handleDeleteBanner={handleDeleteBanner}
          searchText={searchText}
          banners={banners}
          handleUpdateCurrentEpisodes={handleUpdateCurrentEpisodes}
          handleUpdateReleaseDay={handleUpdateReleaseDay}
          handleUpdateReleaseTime={handleUpdateReleaseTime}
        ></ModifyView>
      )}
    </div>
  );
}

export default App;
