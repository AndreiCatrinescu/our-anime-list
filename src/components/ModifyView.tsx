import { Banner } from "../services/bannerService";
import InfoBanner from "./InfoBanner";
import View from "./ViewType";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface Props {
  handleViewChange: (item: View) => void;
  searchText: string;
  searchTextChange: (value: React.SetStateAction<string>) => void;
  banners: Banner[];
  handleUpdateTotalEpisodes: (
    id: string,
    total_episodes: number
  ) => Promise<void>;
  handleUpdateCurrentEpisodes: (
    id: string,
    current_episodes: number
  ) => Promise<void>;
  handleUpdateReleaseDay: (id: string, release_day: string) => Promise<void>;
  handleUpdateReleaseTime: (id: string, release_time: string) => Promise<void>;
  handleDeleteBanner: (banner: Banner) => void;
}

function ModifyView({
  handleViewChange,
  searchText,
  searchTextChange,
  banners,
  handleUpdateTotalEpisodes,
  handleUpdateCurrentEpisodes,
  handleUpdateReleaseDay,
  handleUpdateReleaseTime,
  handleDeleteBanner,
}: Props) {
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Modify Banners</h2>
        <button
          onClick={() => handleViewChange("home")}
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
          onChange={(e) => searchTextChange(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="d-flex flex-column gap-4">
        {banners.map((banner) => (
          <div key={banner.title} className="card">
            <div className="card-body bg-secondary">
              <div className="row">
                <div className="col-md-6">
                  <InfoBanner
                    imageFile={
                      new Blob([new Uint8Array(banner.image_binary)], {
                        type: "image/png",
                      })
                    }
                    title={banner.title}
                    releaseDay={banner.release_day}
                    releaseTime={banner.release_time}
                    currentEpisodes={banner.current_episodes}
                    totalEpisodes={banner.total_episodes}
                  />
                </div>
                <div className="col-md-6">
                  <div className="d-flex flex-column gap-2">
                    <div className="mb-3">
                      <label className="form-label">Current Episodes</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={banner.current_episodes}
                        onChange={(e) =>
                          handleUpdateCurrentEpisodes(
                            banner.title,
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Total Episodes</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={banner.total_episodes}
                        onChange={(e) =>
                          handleUpdateTotalEpisodes(
                            banner.title,
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Release Day</label>
                      <select
                        className="form-select"
                        value={banner.release_day}
                        onChange={(e) =>
                          handleUpdateReleaseDay(banner.title, e.target.value)
                        }
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
                        value={banner.release_time}
                        onChange={(e) =>
                          handleUpdateReleaseTime(banner.title, e.target.value)
                        }
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
}

export default ModifyView;
