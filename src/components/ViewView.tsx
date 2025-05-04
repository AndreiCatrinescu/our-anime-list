import { Banner } from "../services/bannerService";
import InfoBanner from "./InfoBanner";
import View from "./ViewType";

interface Props {
  handleViewChange: (item: View) => void;
  searchText: string;
  banners: Banner[];
  searchTextChange: (value: React.SetStateAction<string>) => void;
}

function ViewView({
  handleViewChange,
  searchText,
  banners,
  searchTextChange,
}: Props) {
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Banners</h2>
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
      <div className="row row-cols-auto g-2">
        {banners.map((banner, index) => (
          <div key={index} className="col px-2">
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
        ))}
      </div>
    </div>
  );
}

export default ViewView;
