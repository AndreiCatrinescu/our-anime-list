import View from "./ViewType";

interface Props {
  usernames: string[];
  handleViewChange: (item: View) => void;
  simulate_attack: () => void;
}

function AdminDashboard({
  handleViewChange,
  usernames,
  simulate_attack,
}: Props) {
  return (
    <div className="container mt-5">
      <h1 className="mb-4">User List</h1>
      <button
        className="btn btn-secondary mt-4"
        onClick={() => handleViewChange("home")}
      >
        Back to Home
      </button>
      <button
        className="btn btn-secondary mt-4"
        onClick={() => simulate_attack()}
      >
        Simulate Attack
      </button>
      <div className="list-group">
        {usernames.map((username, index) => (
          <div key={index} className="list-group-item list-group-item-action">
            {username}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
