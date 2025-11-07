
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ICONS } from '../constants';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { state } = useAppContext();

    return (
        <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="text-slate-600 md:hidden">
                    {ICONS.menu}
                </button>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800">{state.settings.companyName}</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="text-right hidden sm:block">
                    <p className="font-semibold">{state.currentUser?.fullName}</p>
                    {/* FIX: The 'role' property does not exist on the User object. Use 'currentUserRole.name' from the context state instead. */}
                    <p className="text-sm text-slate-500">{state.currentUserRole?.name}</p>
                </div>
                <div className="p-2 bg-slate-200 rounded-full text-slate-600">
                    {ICONS.user}
                </div>
            </div>
        </header>
    );
};

export default Header;
