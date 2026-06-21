// @ts-nocheck
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentSchema } from '../../schemas/characterSchema';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import type { EquipmentItem } from '../../types';
import { Coins, Package, Shield, Sword, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ITEMS_DB, KITS_DB, VOCATION_PROFICIENCIES } from '@/data/itemsDb';

const INITIAL_COINS = 50;

export function EquipmentMerchant() {
  const { draft, setEquipment, nextStep, prevStep } = useCharacterCreationStore();
  
  const [wallet, setWallet] = useState<number>(draft.coins || INITIAL_COINS);
  const [cart, setCart] = useState<EquipmentItem[]>(Array.isArray(draft.equipment) ? draft.equipment : []);
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeDetails, setActiveDetails] = useState<{ title: string; markdown: string } | null>(null);
  
  // UX: Controle de tabs
  const [activeTab, setActiveTab] = useState<'pacote' | 'armas' | 'armaduras' | 'geral'>('pacote');

  const vocationId = draft.vocation || 'Guerreiro';
  const vocationKit = KITS_DB[vocationId];

  // Filtra itens permitidos pela proficiência da classe
  const allowedCategories = VOCATION_PROFICIENCIES[vocationId] || ['Todas'];
  const availableItems = ITEMS_DB.filter(item => allowedCategories.includes(item.category));

  const { handleSubmit } = useForm({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      coins: wallet,
      equipment: cart
    }
  });

  const handleBuy = (item: EquipmentItem) => {
    if (wallet >= (item.cost || 0)) {
      setWallet(prev => prev - (item.cost || 0));
      setCart(prev => [...prev, item]);
    }
  };

  const handleBuyKit = () => {
    if (!vocationKit) return;
    setCart([{ id: 'kit_basico', name: vocationKit.name, type: 'Kit', cost: 50, description: 'Pacote inicial de equipamentos.' }]);
    setWallet(vocationKit.leftover);
  };

  const handleSell = (item: EquipmentItem, index: number) => {
    setWallet(prev => {
      // Se for um kit, ele devolve os 50 integrais (assumindo que o kit gastou 50)
      if (item.id === 'kit_basico') return INITIAL_COINS;
      return prev + (item.cost || 0);
    });
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const handleOpenSheet = (e: React.MouseEvent, title: string, markdown: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDetails({ title, markdown });
    setSheetOpen(true);
  };

  const onSubmit = () => {
    // Manually pass values since we are managing state locally for simplicity before saving
    setEquipment(cart, wallet);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      <div className="flex items-center justify-between bg-stone-800 p-4 rounded-xl border-2 border-amber-500/30">
        <div>
          <h2 className="text-xl font-serif text-stone-100">Mercador da Caravana</h2>
          <p className="text-sm text-stone-400">Compre seus equipamentos iniciais.</p>
        </div>
        <div className="flex items-center space-x-2 text-amber-500 font-bold text-2xl">
          <Coins className="w-8 h-8" />
          <span>{wallet} Siclos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Loja - Ocupa 7 colunas em telas grandes */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-bold text-stone-300 flex items-center"><Package className="mr-2" /> Catálogo</h3>
          
          {/* Navegação de Tabs */}
          <div className="flex bg-stone-900 rounded-lg p-1 border border-stone-700 overflow-x-auto custom-scrollbar">
            {vocationKit && (
              <button
                type="button"
                onClick={() => setActiveTab('pacote')}
                className={`px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${activeTab === 'pacote' ? 'bg-amber-600 text-stone-900' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'}`}
              >
                Pacote Inicial
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('armas')}
              className={`px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${activeTab === 'armas' ? 'bg-amber-600 text-stone-900' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'}`}
            >
              Armas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('armaduras')}
              className={`px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${activeTab === 'armaduras' ? 'bg-amber-600 text-stone-900' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'}`}
            >
              Armaduras
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${activeTab === 'geral' ? 'bg-amber-600 text-stone-900' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'}`}
            >
              Geral
            </button>
          </div>

          {/* Área de rolagem para os itens da loja */}
          <div className="overflow-y-auto max-h-[450px] pr-2 space-y-4 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-900">
            {/* Kit Primário */}
            {activeTab === 'pacote' && vocationKit && (
              <div className="relative p-5 rounded-lg border-2 border-amber-500/50 bg-stone-800/80 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => handleOpenSheet(e, vocationKit.name, vocationKit.markdown)}
                  className="absolute top-3 right-3 text-stone-400 hover:text-amber-500 transition-colors"
                  title="Ver detalhes do kit"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <h4 className="font-serif text-xl text-amber-500 pr-8">{vocationKit.name}</h4>
                <p className="text-sm text-stone-400 mt-2 mb-6">Um conjunto completo de itens recomendado para sua vocação.</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className="text-xs text-stone-400 bg-stone-900 px-3 py-1.5 rounded-full border border-stone-700">
                    Custa: <strong className="text-amber-500">{INITIAL_COINS} SP</strong> (Sobra {vocationKit.leftover} SP)
                  </span>
                  <button 
                    type="button"
                    onClick={handleBuyKit}
                    disabled={wallet < INITIAL_COINS}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-900 font-bold rounded-lg transition-colors w-full sm:w-auto text-center"
                  >
                    Pegar Pacote
                  </button>
                </div>
              </div>
            )}

            {activeTab !== 'pacote' && (
              <div className="space-y-3">
                {availableItems
                  .filter(item => {
                    if (activeTab === 'armas') return item.type === 'Arma';
                    if (activeTab === 'armaduras') return item.type === 'Armadura' || item.type === 'Escudo';
                    if (activeTab === 'geral') return item.type === 'Consumível' || item.type === 'Utilidade';
                    return false;
                  })
                  .map(item => (
                  <div key={item.id} className="relative flex flex-col sm:flex-row sm:items-center justify-between bg-stone-900/80 p-4 rounded-lg border border-stone-700 hover:border-stone-500 transition-colors gap-4">
                    <div className="pr-8 flex-1">
                      <h4 className="font-bold text-stone-200 text-base">{item.name}</h4>
                      <p className="text-xs text-stone-500 mt-1">
                        <span className="text-stone-400">{item.type}</span> 
                        {item.damage ? ` • ${item.damage}` : ''} 
                        {item.armorClass ? ` • CA ${item.armorClass}` : ''}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={wallet < (item.cost || 0) || cart.some(c => c.id === 'kit_basico')}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:hover:bg-stone-800 border border-stone-600 rounded-lg text-amber-500 font-bold transition-colors shrink-0 whitespace-nowrap"
                    >
                      {item.cost} SP
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => handleOpenSheet(e, item.name, item.description || '')}
                      className="absolute top-4 right-4 text-stone-500 hover:text-amber-500 transition-colors"
                      title="Ver detalhes"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventário - Ocupa 5 colunas em telas grandes e fica Fixo (Sticky) na rolagem geral da página */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-stone-800/50 p-5 rounded-xl border border-stone-700">
            <h3 className="text-lg font-bold text-stone-300 mb-4 flex items-center"><Shield className="mr-2" /> Seu Inventário</h3>
            {cart.length === 0 ? (
              <div className="bg-stone-900/50 py-8 px-4 rounded-lg border border-stone-700/50 text-center text-stone-500 italic">
                Sua bolsa está vazia.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-900 pr-1">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between bg-stone-800 p-3 rounded border border-amber-500/20 group hover:border-amber-500/50 transition-colors">
                    <div>
                      <h4 className="font-semibold text-amber-100 text-sm">{item.name}</h4>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleSell(item, index)}
                      className="text-xs text-red-400 opacity-80 group-hover:opacity-100 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded transition-all"
                    >
                      Vender (+{item.id === 'kit_basico' ? INITIAL_COINS : item.cost} SP)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-stone-700">
        <button 
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors"
        >
          Voltar
        </button>
        <button 
          type="submit"
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors"
        >
          Avançar
        </button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-stone-900 border-l border-stone-700 text-stone-100 overflow-y-auto sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle className="text-2xl font-serif text-amber-500 flex items-center gap-2">
              <HelpCircle className="w-6 h-6" /> {activeDetails?.title}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8 pt-6 border-t border-stone-800 space-y-4">
            <div className="prose prose-invert prose-stone prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeDetails?.markdown || ''}
              </ReactMarkdown>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </form>
  );
}
