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
import View from "./components/ViewType";
import LoginScreen from "./components/LoginView";
import AdminDashboard from "./components/AdminDashboard";
import { listen } from "@tauri-apps/api/event";

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
  const [currentView, setCurrentView] = useState<View>("login");
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
  const [usernames, setUserNames] = useState<string[]>([]);
  const bannerServiceRef = useRef<BannerService | BannerLocalMemory>(
    isOnline ? new BannerService() : new BannerLocalMemory()
  );
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const resetBanners = async () => {
    if (bannerServiceRef.current instanceof BannerLocalMemory) return;
    setBanners([]);
    setPageCount(0);
    setHasMore(true);
  };

  useEffect(() => {
    const unlisten = listen<string>("attack_detected", (event) => {
      const new_username = event.payload;
      setUserNames((prev) => [...prev, new_username]);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const simulate_attack = async () => {
    await bannerServiceRef.current.simulate_attack();
  };

  useEffect(() => {
    if (isOnline) {
      if (bannerServiceRef.current instanceof BannerLocalMemory) {
        const remoteService = new BannerService();
        const change_log = bannerServiceRef.current.getChangeLog();
        remoteService.syncServer(change_log);
        bannerServiceRef.current = remoteService;
      }
    } else {
      if (bannerServiceRef.current instanceof BannerService) {
        const localService = new BannerLocalMemory();
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
    const bytes = await blobToBinary(imageFile!);
    await bannerServiceRef.current.addBanner({
      image_binary: bytes,
      title: title,
      release_day: releaseDay,
      release_time: releaseTime,
      current_episodes: currentEpisodes,
      total_episodes: totalEpisodes,
    });
    setTitle("");
    setReleaseDay("");
    setReleaseTime("12:00");
    setBannerImage(null);
    setCurrentEpisodes(0);
    setTotalEpisodes(0);
    setCurrentView("home");
  };
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    resetBanners();
    loadBanners();
  }, [searchText]);

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  const handleDeleteBanner = (banner: Banner) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      bannerServiceRef.current.deleteBanner(banner.title);
      reloadBanners(banners.length - 1);
    }
  };

  const handleUpdateCurrentEpisodes = async (
    id: string,
    current_episodes: number
  ) => {
    bannerServiceRef.current.updateCurrentEpisodes(id, current_episodes);
    reloadBanners(banners.length);
  };

  const handleUpdateTotalEpisodes = async (
    id: string,
    total_episodes: number
  ) => {
    bannerServiceRef.current.updateTotalEpisodes(id, total_episodes);
    reloadBanners(banners.length);
  };

  const handleUpdateReleaseDay = async (id: string, release_day: string) => {
    bannerServiceRef.current.updateReleaseDay(id, release_day);
    reloadBanners(banners.length);
  };

  const handleUpdateReleaseTime = async (id: string, release_time: string) => {
    bannerServiceRef.current.updateReleaseTime(id, release_time);
    reloadBanners(banners.length);
  };

  const handleSearch = (e: React.SetStateAction<string>) => {
    setPageCount(0);
    setSearchText(e);
  };

  const handleLogin = async () => {
    const result = await bannerServiceRef.current.login(userName, password);
    if (result == 0 || result == 1) handleViewChange("home");
  };

  const handleRegister = async () => {
    const result = await bannerServiceRef.current.register(userName, password);
    if (!result) console.error("user already exists");
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">
        Track Anime {isOnline ? "" : "(Offline Mode)"}
      </h1>
      {currentView === "login" && (
        <LoginScreen
          userName={userName}
          password={password}
          passwordChange={setPassword}
          userNameChange={setUserName}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
        ></LoginScreen>
      )}
      {currentView === "home" && (
        <HomeView
          handleViewChange={handleViewChange}
          isAdmin={bannerServiceRef.current.isAdmin}
        ></HomeView>
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
          searchTextChange={handleSearch}
        ></ViewView>
      )}
      {currentView === "modify" && (
        <ModifyView
          handleUpdateTotalEpisodes={handleUpdateTotalEpisodes}
          searchTextChange={handleSearch}
          handleViewChange={handleViewChange}
          handleDeleteBanner={handleDeleteBanner}
          searchText={searchText}
          banners={banners}
          handleUpdateCurrentEpisodes={handleUpdateCurrentEpisodes}
          handleUpdateReleaseDay={handleUpdateReleaseDay}
          handleUpdateReleaseTime={handleUpdateReleaseTime}
        ></ModifyView>
      )}
      {currentView === "dashboard" && (
        <AdminDashboard
          usernames={usernames}
          handleViewChange={handleViewChange}
          simulate_attack={simulate_attack}
        ></AdminDashboard>
      )}
    </div>
  );
}

export default App;
