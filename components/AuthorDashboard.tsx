
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { AuthorUser, Medicine } from '../types';

const AuthorDashboard: React.FC = () => {
    const { user, updateInventory } = useAuth();
    const author = user as AuthorUser;

    const [editStock, setEditStock] = useState<{ [key: string]: string }>({});
    const [newItemName, setNewItemName] = useState('');
    const [newItemBrands, setNewItemBrands] = useState('');
    const [newItemStock, setNewItemStock] = useState('');

    const handleStockChange = (name: string, value: string) => {
        setEditStock(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateStock = (name: string) => {
        const newStockValue = parseInt(editStock[name], 10);
        if (!isNaN(newStockValue) && newStockValue >= 0) {
            const newInventory = author.inventory.map(item => 
                item.name === name ? { ...item, stock: newStockValue } : item
            );
            updateInventory(newInventory);
            setEditStock(prev => {
                const newState = { ...prev };
                delete newState[name];
                return newState;
            });
        }
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const stock = parseInt(newItemStock, 10);
        if (newItemName.trim() && !isNaN(stock) && stock >= 0) {
            const isDuplicate = author.inventory.some(item => item.name.toLowerCase() === newItemName.trim().toLowerCase());
            if (isDuplicate) {
                alert("An item with this generic name already exists in your inventory.");
                return;
            }
            const brands = newItemBrands.split(',').map(b => b.trim()).filter(Boolean);
            const newItem: Medicine = { name: newItemName.trim(), brands, stock };
            const newInventory = [...author.inventory, newItem].sort((a,b) => a.name.localeCompare(b.name));
            updateInventory(newInventory);
            setNewItemName('');
            setNewItemBrands('');
            setNewItemStock('');
        }
    };
    
    return (
        <main className="container mx-auto px-4 pb-16 max-w-4xl space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200/80 dark:bg-slate-800 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Add New Medicine</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Add a new item to your store's inventory list.</p>
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                        <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Generic Name</label>
                        <input
                           id="newItemName"
                           type="text"
                           value={newItemName}
                           onChange={e => setNewItemName(e.target.value)}
                           placeholder="e.g., Paracetamol"
                           required
                           className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                     <div className="md:col-span-4">
                        <label htmlFor="newItemBrands" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Names <span className="text-gray-400 dark:text-gray-500">(comma-separated)</span></label>
                        <input
                           id="newItemBrands"
                           type="text"
                           value={newItemBrands}
                           onChange={e => setNewItemBrands(e.target.value)}
                           placeholder="e.g., Calpol, Dolo 650"
                           className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="newItemStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                         <input
                           id="newItemStock"
                           type="number"
                           min="0"
                           value={newItemStock}
                           onChange={e => setNewItemStock(e.target.value)}
                           placeholder="e.g., 100"
                           required
                           className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <button type="submit" className="md:col-span-2 w-full h-[42px] px-5 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:bg-primary-400">Add Item</button>
                </form>
            </div>
        
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200/80 dark:bg-slate-800 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Your Inventory</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">View and update stock levels for <span className="font-semibold text-gray-700 dark:text-gray-300">{author.storeName}</span>.</p>
                
                <div className="space-y-3">
                    {author.inventory.length > 0 ? author.inventory.map(item => (
                        <div key={item.name} className="bg-slate-50 p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-700/50 dark:border-slate-600">
                           <div className="flex-grow">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-1.5">
                                    {item.brands.length > 0 ? 
                                        item.brands.map(brand => <span key={brand} className="bg-gray-200 px-2 py-0.5 rounded-full font-medium dark:bg-slate-600 dark:text-slate-200">{brand}</span>) :
                                        <span className="text-gray-400 dark:text-gray-500 italic">No brands listed</span>
                                    }
                                </div>
                            </div>

                           <div className="flex-shrink-0 md:w-64 flex items-center gap-2">
                                <div className="flex-grow">
                                    <label htmlFor={`stock-${item.name}`} className="sr-only">Update stock for {item.name}</label>
                                   <input
                                       id={`stock-${item.name}`}
                                       type="number"
                                       min="0"
                                       value={editStock[item.name] ?? item.stock}
                                       onChange={(e) => handleStockChange(item.name, e.target.value)}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-500"
                                   />
                                </div>
                               <button
                                   onClick={() => handleUpdateStock(item.name)}
                                   disabled={!editStock[item.name] || editStock[item.name] === String(item.stock)}
                                   className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 dark:disabled:bg-slate-500"
                                   title="Save stock update"
                                >
                                   Save
                               </button>
                           </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg dark:border-slate-700">
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Your inventory is empty.</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use the form above to add your first medicine.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default AuthorDashboard;
