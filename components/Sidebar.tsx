import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { APP_NAME, MENU_ITEMS, ICONS } from '../constants';
import { supabase } from '../supabase/client';
import { usePermissions } from '../hooks/usePermissions';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
    const { dispatch } = useAppContext();
    const { hasPermission } = usePermissions();
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Effect to open the parent menu if a child is active on load
    useEffect(() => {
        const parentMenu = MENU_ITEMS.find(item => item.children?.some(child => child.id === currentPage));
        if (parentMenu) {
            setOpenMenu(parentMenu.id);
        }
    }, [currentPage]);

    const handleLogout = async () => {
        if (window.confirm("Apakah Anda yakin ingin logout?")) {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error logging out:", error.message);
            }
            dispatch({ type: 'LOGOUT' });
        }
    };

    const handleNavClick = (page: string) => {
        setCurrentPage(page);
        if (window.innerWidth < 768) { // md breakpoint
           setIsOpen(false); // Close sidebar on navigation on mobile
        }
    };

    const handleMenuToggle = (menuId: string) => {
        setOpenMenu(openMenu === menuId ? null : menuId);
    };

    const renderMenuItem = (item: any, isSubmenu = false) => {
        if (!hasPermission(item.permission)) {
            return null;
        }

        if (item.children) {
            // A group is only rendered if at least one of its children is accessible
            const accessibleChildren = item.children.filter((child: any) => hasPermission(child.permission));
            if (accessibleChildren.length === 0) {
                return null;
            }

            const isParentActive = openMenu === item.id || accessibleChildren.some((c: any) => c.id === currentPage);
            return (
                <div key={item.id}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleMenuToggle(item.id); }}
                        className={`flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isParentActive ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
                    >
                        <div className="flex items-center space-x-3">
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                        <span className={`transform transition-transform duration-200 ${openMenu === item.id ? 'rotate-180' : ''}`}>{ICONS.chevronDown}</span>
                    </a>
                    <div className={`pl-6 transition-all duration-300 ease-in-out overflow-hidden ${openMenu === item.id ? 'max-h-96' : 'max-h-0'}`}>
                         <div className="py-2 space-y-1">
                            {accessibleChildren.map((child: any) => renderMenuItem(child, true))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <a
                key={item.id}
                href="#"
                onClick={(e) => { e.preventDefault(); handleNavClick(item.id); }}
                className={`flex items-center space-x-3 rounded-lg transition-colors duration-200 ${isSubmenu ? 'px-3 py-2 text-sm' : 'px-4 py-3'} ${currentPage === item.id ? 'bg-sky-500 text-white' : 'hover:bg-slate-700'}`}
            >
                {item.icon}
                <span>{item.label}</span>
            </a>
        );
    };

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-slate-700">
                    {APP_NAME}
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                    {MENU_ITEMS.map(item => renderMenuItem(item))}
                </nav>
                <div className="px-4 py-4 border-t border-slate-700">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleLogout(); }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                    >
                        {ICONS.logout}
                        <span>Logout</span>
                    </a>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;