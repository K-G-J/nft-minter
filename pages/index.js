import { useMoralis } from "react-moralis";
import AuthPage from "../components/AuthPage";
import UploadForm from "../components/UploadForm";

export default function Home() {

  const { isAuthenticated, authenticate, logout, user } = useMoralis()

  const metamaskAuth = async () => {
    try {
      await authenticate({
        signingMessage: 'Auth to start lazy minting your NFTs',
      })
    } catch (err) {
      console.log(err);
    }
  }

  if (!isAuthenticated) {
    return (
      <AuthPage  metamaskAuth={metamaskAuth} />
    )
  }
  return (
    <div>
      <UploadForm logout={logout} user={user} />
    </div>
  )
}
