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
  title: string;
  releaseTime: string;
  releaseDay: string;
  currentEpisodes: number;
  totalEpisodes: number;
  handleViewChange: (item: View) => void;
  setTitle: (value: React.SetStateAction<string>) => void;
  setReleaseDay: (value: React.SetStateAction<string>) => void;
  setReleaseTime: (value: React.SetStateAction<string>) => void;
  setCurrentEpisodes: (value: React.SetStateAction<number>) => void;
  setTotalEpisodes: (value: React.SetStateAction<number>) => void;
  handleAddBanner: () => Promise<void>;
  setBannerImage: (value: React.SetStateAction<Blob | null>) => void;
}

function AddView({
  handleViewChange,
  setTitle,
  title,
  releaseDay,
  setReleaseDay,
  setReleaseTime,
  releaseTime,
  setCurrentEpisodes,
  currentEpisodes,
  setTotalEpisodes,
  totalEpisodes,
  setBannerImage,
  handleAddBanner,
}: Props) {
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Add New Banner</h2>
        <button
          onClick={() => handleViewChange("home")}
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
            onChange={(e) => {
              if (e.target.files) setBannerImage(e.target.files[0]);
            }}
            className="form-control"
          />
        </div>
        <button onClick={handleAddBanner} className="btn btn-primary">
          Add Banner
        </button>
      </div>
    </div>
  );
}

export default AddView;
