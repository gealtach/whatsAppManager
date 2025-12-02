'use client';

import { FaWhatsapp } from "react-icons/fa6";
import { ProtectedPage } from "../components/ProtectedPage";
import AccountManager from "../components/AccountManager";
import { useCallback, useEffect, useState } from "react";
import { Account } from "../Types";
import ClientManager from "../components/ClientManager";
import BroadcastManager from "../components/BroadcastManager";
import { IoLogOut } from "react-icons/io5";
import { useAuth } from "@/context/auth-context";
import AccountSettings from "../components/AccountSettings";
import { fetchClient } from "../lib/fetchClient";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import TemplateManager from "../components/TemplateManager";

const Page = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aux, setAux] = useState<boolean>(false);

  const updateAccount = () => {
    setAux(!aux)
    setActiveTab('accounts');
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchClient.get('/account');
      const ans = await response.json();
      if (response.ok) setAccounts(ans.payload);
      else toast.error(ans.message);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Erro desconhecido');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [aux, fetchData]);

  // Función para manejar el cambio de tab
  const handleTabChange = (tabId: string) => {
    if (tabId === 'accounts') {
      setSelectedAccount(undefined);
    }
    setActiveTab(tabId);
  };

  // Definir las tabs
  const tabs = [
    {
      id: 'accounts',
      name: 'Contas',
      component: <AccountManager reload={() => setAux(!aux)} accounts={accounts} onAccountSelect={(account) => {
        setSelectedAccount(account);
        setActiveTab('clients');
      }} />
    },
    {
      id: 'clients',
      name: 'Clientes',
      component: selectedAccount ? <ClientManager selectedAccount={selectedAccount} /> : null,
      requiresAccount: true
    },
    {
      id: 'broadcasts',
      name: 'Difussões',
      component: selectedAccount ? <BroadcastManager selectedAccount={selectedAccount} /> : null,
      requiresAccount: true
    },
    {
      id: "templates",
      name: "Templates",
      component: selectedAccount ? <TemplateManager account={selectedAccount} /> : null,
      requiresAccount: true
    },
    {
      id: 'settings',
      name: 'Definições',
      component: selectedAccount ? <AccountSettings updateAccount={updateAccount} selectedAccount={selectedAccount} /> : null,
      requiresAccount: true
    }
  ];

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
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center ${tab.requiresAccount && !selectedAccount
                    ? 'hidden'
                    : 'cursor-pointer'
                    }`}
                  disabled={tab.requiresAccount && !selectedAccount}
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
            {tabs.map((tab) => (
              activeTab === tab.id &&
              <div key={tab.id}>
                {tab.component}
              </div>
            ))}
          </div>
        </main>
      </div>
      {isLoading && <Loading />}
    </ProtectedPage>
  );
};

export default Page;