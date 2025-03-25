import "./App.css";
import { useState, useEffect, useRef } from "react";
import InfoBanner from "./components/InfoBanner";
import { BannerService, Banner } from "./services/bannerService";
import 'bootstrap/dist/css/bootstrap.min.css';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

type View = 'home' | 'add' | 'view' | 'modify';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [releaseDay, setReleaseDay] = useState("");
  const [releaseTime, setReleaseTime] = useState("12:00");
  // const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [imageFile, setBannerImage] = useState<Blob | null>(null);
  const [currentEpisodes, setCurrentEpisodes] = useState<number>(0);
  const [totalEpisodes, setTotalEpisodes] = useState<number>(0);
  const [searchText, setSearchText] = useState("");
  const bannerServiceRef = useRef(new BannerService());

  const loadBanners = () => {
    if (searchText.trim() === "") {
      setBanners([]);
      setTimeout(() => {
        setBanners(bannerServiceRef.current.getAllBanners());
      }, 0);
    } else {
      setBanners([]);
      setTimeout(() => {
        setBanners(bannerServiceRef.current.searchBanners(searchText));
      }, 0);
    }
  };

  const handleAddBanner = () => {
    try {
      bannerServiceRef.current.addBanner({
        imageFile: imageFile!,
        title: title,
        releaseDay: releaseDay,
        releaseTime: releaseTime,
        currentEpisodes: currentEpisodes,
        totalEpisodes: totalEpisodes
      });
      setBanners(bannerServiceRef.current.getAllBanners());
      // Clear all input fields
      setTitle("");
      setReleaseDay("");
      setReleaseTime("12:00");
      setBannerImage(null);
      setCurrentEpisodes(0);
      setTotalEpisodes(0);
      setCurrentView('home');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add banner');
    }
  };

  useEffect(() => {
    if (currentView === 'view' || currentView === 'modify') {
      loadBanners();
    }
  }, [searchText, currentView]);

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
    if (newView === 'view' || newView === 'modify') {
      loadBanners();
    }
  };

  // const handleUpdateEpisodes = (banner: Banner, increment: boolean) => {
  //   bannerServiceRef.current.updateBanner(banner.id, {
  //     currentEpisodes: increment ? banner.currentEpisodes + 1 : Math.max(0, banner.currentEpisodes - 1)
  //   });
  //   loadBanners();
  // };

  // const handleUpdateTotalEpisodes = (banner: Banner, increment: boolean) => {
  //   bannerServiceRef.current.updateBanner(banner.id, {
  //     totalEpisodes: increment ? banner.totalEpisodes + 1 : Math.max(0, banner.totalEpisodes - 1)
  //   });
  //   loadBanners();
  // };

  // const handleUpdateReleaseTime = (banner: Banner, newTime: string) => {
  //   bannerServiceRef.current.updateBanner(banner.id, { releaseTime: newTime });
  //   loadBanners();
  // };

  const handleDeleteBanner = (banner: Banner) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      bannerServiceRef.current.deleteBanner(banner.title);
      loadBanners();
    }
  };

  const handleUpdateBanner = (id: string, updates: Partial<Omit<Banner, 'id'>>) => {
    bannerServiceRef.current.updateBanner(id, updates);
    setBanners(bannerServiceRef.current.getAllBanners());
  };

  const renderHomeView = () => (
    <div className="d-flex flex-column gap-3 align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <button
        onClick={() => handleViewChange('add')}
        className="btn btn-primary btn-lg w-50"
      >
        Add New Banner
      </button>
      <button
        onClick={() => handleViewChange('view')}
        className="btn btn-info btn-lg w-50"
      >
        View All Banners
      </button>
      <button
        onClick={() => handleViewChange('modify')}
        className="btn btn-warning btn-lg w-50"
      >
        Modify Banners
      </button>
    </div>
  );

  const renderAddView = () => (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Add New Banner</h2>
        <button
          onClick={() => handleViewChange('home')}
          className="btn btn-secondary"
        >
          Back to Home
        </button>
      </div>
      <div className="d-flex flex-column gap-3">
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Release Day</label>
          <select
            value={releaseDay}
            onChange={(e) => setReleaseDay(e.target.value)}
            className="form-select"
          >
            <option value="">Select a day</option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Release Time</label>
          <input
            type="time"
            value={releaseTime}
            onChange={(e) => setReleaseTime(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="row">
          <div className="col">
            <div className="mb-3">
              <label className="form-label">Current Episodes</label>
              <input
                type="number"
                value={currentEpisodes}
                onChange={(e) => setCurrentEpisodes(Number(e.target.value))}
                className="form-control"
                min="0"
              />
            </div>
          </div>
          <div className="col">
            <div className="mb-3">
              <label className="form-label">Total Episodes</label>
              <input
                type="number"
                value={totalEpisodes}
                onChange={(e) => setTotalEpisodes(Number(e.target.value))}
                className="form-control"
                min="0"
              />
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Banner Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { if (e.target.files) setBannerImage(e.target.files[0]) }}
            className="form-control"
          />
        </div>
        <button
          onClick={handleAddBanner}
          className="btn btn-primary"
        >
          Add Banner
        </button>
      </div>
    </div>
  );

  const renderViewView = () => (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Banners</h2>
        <button
          onClick={() => handleViewChange('home')}
          className="btn btn-secondary"
        >
          Back to Home
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="row row-cols-auto g-2">
        {banners.map((banner, index) => (
          <div key={index} className="col px-2">
            <InfoBanner {...banner} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderModifyView = () => (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Modify Banners</h2>
        <button
          onClick={() => handleViewChange('home')}
          className="btn btn-secondary"
        >
          Back to Home
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="d-flex flex-column gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="card">
            <div className="card-body bg-secondary">
              <div className="row">
                <div className="col-md-6">
                  <InfoBanner {...banner} />
                </div>
                <div className="col-md-6">
                  <div className="d-flex flex-column gap-2">
                    <div className="mb-3">
                      <label className="form-label">Current Episodes</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={banner.currentEpisodes}
                        onChange={(e) => handleUpdateBanner(banner.id, { currentEpisodes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Total Episodes</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={banner.totalEpisodes}
                        onChange={(e) => handleUpdateBanner(banner.id, { totalEpisodes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Release Day</label>
                      <select
                        className="form-select"
                        value={banner.releaseDay}
                        onChange={(e) => handleUpdateBanner(banner.id, { releaseDay: e.target.value })}
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Release Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={banner.releaseTime}
                        onChange={(e) => handleUpdateBanner(banner.id, { releaseTime: e.target.value })}
                      />
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteBanner(banner)}
                    >
                      Delete Banner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Track Anime</h1>
      {currentView === 'home' && renderHomeView()}
      {currentView === 'add' && renderAddView()}
      {currentView === 'view' && renderViewView()}
      {currentView === 'modify' && renderModifyView()}
    </div>
  );
}

export default App;
