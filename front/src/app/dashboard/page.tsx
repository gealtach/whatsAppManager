'use client';

import { FaWhatsapp } from "react-icons/fa6";
import { ProtectedPage } from "../components/ProtectedPage";
import AccountManager from "../components/AccountManager";
import { useState } from "react";
import { Account } from "../Types";
import ClientManager from "../components/ClientManager";
import BroadcastManager from "../components/BroadcastManager";
import { IoLogOut } from "react-icons/io5";
import { useAuth } from "@/context/auth-context";

const Page = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined);

  // Función para manejar el cambio de tab
  const handleTabChange = (tabId: string) => {
    if (tabId === 'accounts') {
      setSelectedAccount(undefined);
    }
    setActiveTab(tabId);
  };

  return (
    <ProtectedPage redirectPath="/">
      <div className="min-h-screen min-w-screen bg-background">
        <header className="bg-white shadow flex justify-between">
          <div className="max-w-7xl flex items-center gap-3 px-4 py-6">
            <FaWhatsapp className="text-verde" size={40} />
            <h1 className="text-3xl font-bold text-gray-900">
              WhatsApp Manager
            </h1>
          </div>
            <button
              onClick={logout}
              className="text-red-500 mr-5 cursor-pointer">
              <IoLogOut size={30} />
            </button>
        </header>
        <main className="mx auto px-4 py-6">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 pb-3">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'accounts', name: 'Contas' },
                { id: 'clients', name: 'Clientes' },
                { id: 'broadcasts', name: 'Difussões' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center ${(tab.id === 'clients' || tab.id === 'broadcasts') && !selectedAccount
                    ? 'hidden'
                    : 'cursor-pointer'
                    }`}
                  disabled={(tab.id === 'clients' || tab.id === 'broadcasts') && !selectedAccount}
                >
                  <span className={`${activeTab === tab.id ? 'opacity-120' : 'opacity-70'}`}>
                    {tab.name}
                  </span>
                  {activeTab === tab.id && (
                    <div className="w-10 h-1 bg-verde rounded mt-1"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'accounts' && (
              <AccountManager
                onAccountSelect={(account) => {
                  setSelectedAccount(account);
                  setActiveTab('clients');
                }}
              />
            )}
            {activeTab === 'clients' && selectedAccount && (
              <ClientManager selectedAccount={selectedAccount} />
            )}
            {activeTab === 'broadcasts' && selectedAccount && (
              <BroadcastManager selectedAccount={selectedAccount} />
            )}

          </div>
        </main>
      </div>
    </ProtectedPage>
  );
};

export default Page;