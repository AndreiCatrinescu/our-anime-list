import View from "./ViewType";

interface Props {
  handleViewChange: (item: View) => void;
  isAdmin: boolean;
}

function HomeView({ handleViewChange, isAdmin }: Props) {
  return (
    <div
      className="d-flex flex-column gap-3 align-items-center justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <button
        onClick={() => handleViewChange("add")}
        className="btn btn-primary btn-lg w-50"
      >
        Add New Banner
      </button>
      <button
        onClick={() => handleViewChange("view")}
        className="btn btn-info btn-lg w-50"
      >
        View All Banners
      </button>
      <button
        onClick={() => handleViewChange("modify")}
        className="btn btn-warning btn-lg w-50"
      >
        Modify Banners
      </button>
      {isAdmin && (
        <button
          onClick={() => handleViewChange("dashboard")}
          className="btn btn-warning btn-lg w-50"
        >
          DashBoard
        </button>
      )}
    </div>
  );
}

export default HomeView;
