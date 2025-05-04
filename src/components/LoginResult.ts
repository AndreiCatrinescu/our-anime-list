type LoginResult =
  | { status: 'Admin' }
  | { status: 'User' }
  | { status: 'Fail'; error: string };

  export default LoginResult;