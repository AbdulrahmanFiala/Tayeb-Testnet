import { Route, Routes } from "react-router";
import "./App.css";
import { NavBar } from "./components/NavBar";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { SwapPage } from "./pages/SwapPage";
import { TokensPage } from "./pages/TokensPage";

function App() {
	return (
		<div className='dark bg-background-dark min-h-screen flex flex-col font-display'>
			<NavBar />
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/swap' element={<SwapPage />} />
				<Route path='/tokens' element={<TokensPage />} />
				<Route path='/about' element={<AboutPage />} />
			</Routes>
		</div>
	);
}

export default App;
