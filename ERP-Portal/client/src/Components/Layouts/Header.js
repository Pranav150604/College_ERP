import React, { useContext } from "react";
import { FaUniversity } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { Link } from "react-router-dom";
import UserContext from "../../Hooks/UserContext";
import { toast } from "react-toastify";

const Header = () => {
  const { setUser, setPaperList } = useContext(UserContext);
  const logout = () => {
    setUser("");
    setPaperList([]);
    localStorage.clear();
    toast.info("Logged Out");
  };
  return (
    <header className="absolute top-0 flex w-full justify-between bg-slate-950 text-slate-50 dark:bg-slate-950 ">
      <Link
        to="/dash"
        className="ml-4 flex items-center gap-2 px-3 py-1 text-2xl font-semibold sm:text-3xl"
      >
        {/* <FaUniversity className="m-1" /> */}
        <img
          src="/favicon.ico"
          alt="College Icon"
          className="inline-block h-10 w-10 rounded-full md:h-12 md:w-12 xl:h-12 xl:w-12"
        />
        <h1 className="m-0 pr-1 font-spectral text-slate-50 decoration-violet-500 decoration-[3px] underline-offset-[3px] hover:underline">
          SGBIT
        </h1>
      </Link>
      <Link
        to="./"
        className="text-md m-2 mr-4 flex items-center rounded-md p-[7px] font-semibold duration-200 hover:bg-red-700 hover:text-slate-100"
        onClick={() => logout()}
      >
        <p>&nbsp;Logout&nbsp;&nbsp;</p>
        <FiLogOut className="text-xl" />
      </Link>
    </header>
  );
};

export default Header;