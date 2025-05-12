interface Props {
  userName: string;
  password: string;
  userNameChange: (value: React.SetStateAction<string>) => void;
  passwordChange: (value: React.SetStateAction<string>) => void;
  handleLogin: () => void;
  handleRegister: () => void;
}

function LoginScreen({
  userName,
  password,
  userNameChange,
  passwordChange,
  handleLogin,
  handleRegister,
}: Props) {
  return (
    <div>
      <h2 className="text-center mb-4">Login</h2>
      <div>
        <input
          type="text"
          placeholder="Username"
          value={userName}
          className="form-control"
          onChange={(e) => userNameChange(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="form-control"
          onChange={(e) => passwordChange(e.target.value)}
        />
      </div>
      <button className="btn btn-primary w-100" onClick={() => handleLogin()}>
        Login
      </button>
      <button
        className="btn btn-primary w-100"
        onClick={() => handleRegister()}
      >
        Register
      </button>
    </div>
  );
}

export default LoginScreen;
