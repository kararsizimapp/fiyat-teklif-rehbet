/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, ProductOption, ProductChoice, BrandInfo, CategoryInfo, CollarOption } from '../types';
import { DEFAULT_COLLAR_OPTIONS } from '../data';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (newProducts: Product[]) => void;
  brands: BrandInfo[];
  onUpdateBrands: (newBrands: BrandInfo[]) => void;
  categories: CategoryInfo[];
  onUpdateCategories: (newCategories: CategoryInfo[]) => void;
  kdvRates: number[];
  onUpdateKdvRates: (newKdvRates: number[]) => void;
  onResetToDefaults: () => void;
}

const compressAndResizeImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxHeight) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string || '');
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string || '');
      };
      img.src = event.target?.result as string || '';
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

export function AdminPanelModal({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
  brands,
  onUpdateBrands,
  categories,
  onUpdateCategories,
  kdvRates,
  onUpdateKdvRates,
  onResetToDefaults
}: AdminPanelModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Modal navigation tab: 'products' vs 'settings'
  const [modalTab, setModalTab] = useState<'products' | 'settings'>('products');

  // Custom Inline Modals / Confirmation dialogues to bypass security sandbox on window.confirm
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings Dynamic inputs
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Shirt');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');

  const [newKdvRate, setNewKdvRate] = useState<number | ''>('');

  const [editingBrand, setEditingBrand] = useState<BrandInfo | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [editingKdv, setEditingKdv] = useState<number | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Form State for Products
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    brand: string;
    category: string;
    collection: string;
    basePrice: number;
    kdvRate: number;
    otvRate: number;
    description: string;
    stock: number;
    images: string[];
    rating: number;
    popularity: number;
    specs: { key: string; val: string }[];
    options: ProductOption[];
    branch: string;
    collarOptions: CollarOption[];
  }>({
    id: '',
    name: '',
    brand: brands[0]?.name || '',
    category: categories[0]?.id || '',
    collection: '',
    basePrice: 1000,
    kdvRate: kdvRates[0] || 20,
    otvRate: 0,
    description: '',
    stock: 50,
    images: [''],
    rating: 4.5,
    popularity: 80,
    specs: [
      { key: 'Koleksiyon', val: '' },
      { key: 'Kumaş Türü', val: '' },
      { key: 'Kol Tipi', val: '' },
      { key: 'Kumaş Gramajı', val: '' }
    ],
    options: [],
    branch: 'Antrenman',
    collarOptions: []
  });

  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'specs' | 'options' | 'collars'>('info');

  if (!isOpen) return null;

  // Filter products for the admin sidebar
  const filteredAdminProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Tümü' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Start Editing or Adding
  const handleStartEdit = (product: Product) => {
    setIsAddingNew(false);
    setEditingProduct(product);
    setActiveTab('info');

    // Convert specs object to array for form editing and pre-populate missing standard keys gracefully
    const currentSpecs = product.specs || {};
    const defaultKeys = ['Koleksiyon', 'Kumaş Türü', 'Kol Tipi', 'Kumaş Gramajı'];
    const specsArray: { key: string; val: string }[] = [];
    
    // 1. Keep all existing ones
    Object.entries(currentSpecs).forEach(([key, val]) => {
      specsArray.push({ key, val });
    });
    
    // 2. Append standard ones with empty values if they don't exist
    defaultKeys.forEach(defKey => {
      if (!specsArray.some(s => s.key.toLowerCase() === defKey.toLowerCase())) {
        specsArray.push({ key: defKey, val: '' });
      }
    });

    // Ensure images has at least one item
    const imgsList = product.images && product.images.length > 0 
      ? [...product.images] 
      : [product.image];

    setFormData({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      collection: product.collection || '',
      basePrice: product.basePrice,
      kdvRate: product.kdvRate,
      otvRate: product.otvRate || 0,
      description: product.description,
      stock: product.stock,
      images: imgsList,
      rating: product.rating || 4.5,
      popularity: product.popularity || 80,
      specs: specsArray,
      options: JSON.parse(JSON.stringify(product.options || [])), // deep copy
      branch: product.branch || 'Antrenman',
      collarOptions: JSON.parse(JSON.stringify(product.collarOptions || DEFAULT_COLLAR_OPTIONS))
    });
  };

  const handleStartAddNew = () => {
    const newProduct: Product = {
      id: `custom-prod-${Date.now()}`,
      name: 'Yeni Spor Ürünü',
      brand: brands[0]?.name || 'Hummel Teamwear',
      category: categories[0]?.id || 'giyim',
      collection: 'Yeni Sezon',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500'],
      basePrice: 1000,
      kdvRate: kdvRates[0] || 20,
      otvRate: 0,
      description: 'Yeni spor ürünü açıklaması.',
      stock: 50,
      rating: 4.5,
      popularity: 80,
      specs: { 
        'Koleksiyon': 'Teamwear',
        'Kumaş Türü': '',
        'Kol Tipi': '',
        'Kumaş Gramajı': ''
      },
      branch: 'Antrenman',
      options: [
        {
          id: 'size',
          name: 'Beden Seçimi',
          choices: [
            { name: 'S', priceInfluence: 0 },
            { name: 'M', priceInfluence: 0 },
            { name: 'L', priceInfluence: 0 },
            { name: 'XL', priceInfluence: 0 }
          ]
        }
      ]
    };

    const updatedProducts = [newProduct, ...products];
    onUpdateProducts(updatedProducts);

    setIsAddingNew(false);
    setEditingProduct(newProduct);
    setActiveTab('info');
    
    setFormData({
      id: newProduct.id,
      name: newProduct.name,
      brand: newProduct.brand,
      category: newProduct.category,
      collection: newProduct.collection || '',
      basePrice: newProduct.basePrice,
      kdvRate: newProduct.kdvRate,
      otvRate: newProduct.otvRate || 0,
      description: newProduct.description,
      stock: newProduct.stock,
      images: [...newProduct.images!],
      rating: newProduct.rating,
      popularity: newProduct.popularity,
      specs: Object.entries(newProduct.specs || {}).map(([key, val]) => ({ key, val })),
      options: JSON.parse(JSON.stringify(newProduct.options || [])),
      branch: newProduct.branch || 'Antrenman',
      collarOptions: JSON.parse(JSON.stringify(newProduct.collarOptions || DEFAULT_COLLAR_OPTIONS))
    });

    triggerToast('Yeni varsayılan ürün başarıyla eklendi ve seçildi!');
  };

  // Image helpers
  const handleAddImageUrlInput = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleRemoveImageUrlInput = (index: number) => {
    setFormData(prev => {
      const updated = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: updated.length > 0 ? updated : ['']
      };
    });
  };

  const handleImageChange = (index: number, val: string) => {
    setFormData(prev => {
      const updated = [...prev.images];
      updated[index] = val;
      return { ...prev, images: updated };
    });
  };

  // Specs helpers
  const handleAddSpecRow = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { key: '', val: '' }]
    }));
  };

  const handleRemoveSpecRow = (index: number) => {
    setFormData(prev => {
      const updated = prev.specs.filter((_, i) => i !== index);
      return {
        ...prev,
        specs: updated.length > 0 ? updated : [{ key: '', val: '' }]
      };
    });
  };

  const handleSpecKeyChange = (index: number, val: string) => {
    setFormData(prev => {
      const updated = [...prev.specs];
      updated[index].key = val;
      return { ...prev, specs: updated };
    });
  };

  const handleSpecValChange = (index: number, val: string) => {
    setFormData(prev => {
      const updated = [...prev.specs];
      updated[index].val = val;
      return { ...prev, specs: updated };
    });
  };

  // Option / Choices helpers (sizing, color extra options)
  const handleAddOption = () => {
    const newOpt: ProductOption = {
      id: `opt-${Date.now()}`,
      name: 'Yeni Seçenek (Örn: Baskı Tercihi)',
      choices: []
    };
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOpt]
    }));
  };

  const handleRemoveOption = (optIndex: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== optIndex)
    }));
  };

  const handleOptionNameChange = (optIndex: number, name: string) => {
    setFormData(prev => {
      const updated = [...prev.options];
      updated[optIndex].name = name;
      return { ...prev, options: updated };
    });
  };

  const handleAddChoice = (optIndex: number) => {
    setFormData(prev => {
      const updated = [...prev.options];
      updated[optIndex].choices.push({ name: '', priceInfluence: 0 });
      return { ...prev, options: updated };
    });
  };

  const handleRemoveChoice = (optIndex: number, choiceIndex: number) => {
    setFormData(prev => {
      const updated = [...prev.options];
      updated[optIndex].choices = updated[optIndex].choices.filter((_, i) => i !== choiceIndex);
      return { ...prev, options: updated };
    });
  };

  const handleChoiceNameChange = (optIndex: number, choiceIndex: number, name: string) => {
    setFormData(prev => {
      const updated = [...prev.options];
      updated[optIndex].choices[choiceIndex].name = name;
      return { ...prev, options: updated };
    });
  };

  const handleChoicePriceChange = (optIndex: number, choiceIndex: number, price: number) => {
    setFormData(prev => {
      const updated = [...prev.options];
      updated[optIndex].choices[choiceIndex].priceInfluence = price;
      return { ...prev, options: updated };
    });
  };

  // Collar Options state-modifiers
  const handleToggleCollar = (index: number) => {
    setFormData(prev => {
      const updated = [...prev.collarOptions];
      if (updated[index]) {
        updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      }
      return { ...prev, collarOptions: updated };
    });
  };

  const handleUpdateCollarField = (index: number, field: keyof CollarOption, value: any) => {
    setFormData(prev => {
      const updated = [...prev.collarOptions];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, collarOptions: updated };
    });
  };

  const handleAddNewCollar = () => {
    const newCollar: CollarOption = {
      name: 'Yeni Özel Yaka',
      desc: 'Bu yaka çeşidine ait detaylı açıklama metni.',
      tag: 'Özel Seri',
      iconKey: 'Layers',
      priceInfluence: 0,
      enabled: true
    };
    setFormData(prev => ({
      ...prev,
      collarOptions: [...prev.collarOptions, newCollar]
    }));
  };

  const handleRemoveCollar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      collarOptions: prev.collarOptions.filter((_, i) => i !== index)
    }));
  };

  // Delete Action product
  const handleDeleteProduct = (prodId: string) => {
    setProductToDelete(prodId);
  };

  // Save / Add handler product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage('Lütfen ürün ismini doldurun.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    // Clean up specs array back to specs object
    const cleanSpecs: { [key: string]: string } = {};
    formData.specs.forEach(s => {
      if (s.key.trim() && s.val.trim()) {
        cleanSpecs[s.key.trim()] = s.val.trim();
      }
    });

    // Clean images: remove empty strings, keep valid URLs or Base64
    const cleanImages = formData.images.filter(img => img.trim() !== '');
    const mainImage = cleanImages.length > 0 ? cleanImages[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500';

    const processedProduct: Product = {
      id: formData.id,
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      collection: formData.collection || undefined,
      image: mainImage,
      images: cleanImages.length > 0 ? cleanImages : [mainImage],
      basePrice: Number(formData.basePrice) || 0,
      kdvRate: Number(formData.kdvRate) || 0,
      otvRate: Number(formData.otvRate) || undefined,
      description: formData.description || `${formData.name} Spor Ürünü`,
      stock: Number(formData.stock) || 0,
      rating: formData.rating,
      popularity: formData.popularity,
      specs: cleanSpecs,
      options: formData.options.filter(opt => opt.name.trim() !== ''),
      branch: formData.branch || 'Antrenman',
      collarOptions: formData.collarOptions
    };

    let updatedProducts: Product[];
    if (isAddingNew) {
      updatedProducts = [processedProduct, ...products];
      setIsAddingNew(false);
      setEditingProduct(processedProduct);
    } else {
      updatedProducts = products.map(p => p.id === processedProduct.id ? processedProduct : p);
    }

    onUpdateProducts(updatedProducts);
    triggerToast('Ürün başarıyla kaydedildi!');
  };

  // Brand Options Settings Handlers
  const handleStartEditBrand = (brand: BrandInfo) => {
    setEditingBrand(brand);
    setEditingCategory(null);
    setEditingKdv(null);
    setNewBrandName(brand.name);
    setNewBrandLogo(brand.logo);
    setNewBrandOrigin(brand.origin);
    setNewBrandDesc(brand.description || '');
  };

  const handleCancelEditBrand = () => {
    setEditingBrand(null);
    setNewBrandName('');
    setNewBrandLogo('');
    setNewBrandOrigin('');
    setNewBrandDesc('');
  };

  const handleAddNewBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    if (editingBrand) {
      if (newBrandName.trim().toLowerCase() !== editingBrand.name.toLowerCase() &&
          brands.some(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase())) {
        setErrorMessage('Bu marka ismi sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3050);
        return;
      }

      const updatedBrand: BrandInfo = {
        name: newBrandName.trim(),
        logo: newBrandLogo.trim() || newBrandName.trim().substring(0, 3).toUpperCase(),
        origin: newBrandOrigin.trim() || 'Türkiye',
        description: newBrandDesc.trim() || 'Spor Giyim Markası'
      };

      const updatedBrands = brands.map(b => b.name === editingBrand.name ? updatedBrand : b);
      onUpdateBrands(updatedBrands);

      if (newBrandName.trim() !== editingBrand.name) {
        const updatedProducts = products.map(p => p.brand === editingBrand.name ? { ...p, brand: newBrandName.trim() } : p);
        onUpdateProducts(updatedProducts);
      }

      handleCancelEditBrand();
      triggerToast(`"${updatedBrand.name}" markası başarıyla güncellendi!`);
    } else {
      if (brands.some(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase())) {
        setErrorMessage('Bu marka ismi sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3050);
        return;
      }

      const addedBrand: BrandInfo = {
        name: newBrandName.trim(),
        logo: newBrandLogo.trim() || newBrandName.trim().substring(0, 3).toUpperCase(),
        origin: newBrandOrigin.trim() || 'Türkiye',
        description: newBrandDesc.trim() || 'Spor Giyim Markası'
      };

      onUpdateBrands([...brands, addedBrand]);
      handleCancelEditBrand();
      triggerToast(`"${addedBrand.name}" markası başarıyla eklendi!`);
    }
  };

  const handleDeleteBrand = (brandName: string) => {
    if (editingBrand && editingBrand.name === brandName) {
      handleCancelEditBrand();
    }
    const updated = brands.filter(b => b.name !== brandName);
    onUpdateBrands(updated);
    triggerToast(`"${brandName}" markası sistemden silindi.`);
  };

  // Category Options Settings Handlers
  const handleStartEditCategory = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setEditingBrand(null);
    setEditingKdv(null);
    setNewCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.iconName);
    setNewCatDesc(cat.description || '');
    setNewCatParentId(cat.parentId || '');
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCatId('');
    setNewCatName('');
    setNewCatIcon('Shirt');
    setNewCatDesc('');
    setNewCatParentId('');
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatId.trim()) return;

    // Transliterate Turkish characters safely and strip symbols for flawless Slug IDs
    const turkishMap: { [key: string]: string } = {
      'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
      'İ': 'i', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'Ç': 'c'
    };
    let cleanSlug = newCatId.trim().toLowerCase();
    for (const key of Object.keys(turkishMap)) {
      cleanSlug = cleanSlug.split(key).join(turkishMap[key]);
    }
    const formattedId = cleanSlug
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (editingCategory) {
      if (formattedId !== editingCategory.id && categories.some(c => c.id === formattedId)) {
        setErrorMessage('Bu kategori kod ID’si sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3050);
        return;
      }

      if (newCatName.trim().toLowerCase() !== editingCategory.name.toLowerCase() &&
          categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
        setErrorMessage('Bu kategori adı sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3050);
        return;
      }

      const updatedCategory: CategoryInfo = {
        id: formattedId,
        name: newCatName.trim(),
        iconName: newCatIcon,
        description: newCatDesc.trim() || `${newCatName.trim()} Spor Ekipmanları`,
        parentId: newCatParentId || undefined
      };

      const updatedCategories = categories.map(c => c.id === editingCategory.id ? updatedCategory : c);
      onUpdateCategories(updatedCategories);

      if (formattedId !== editingCategory.id) {
        const updatedProducts = products.map(p => p.category === editingCategory.id ? { ...p, category: formattedId } : p);
        onUpdateProducts(updatedProducts);
      }

      handleCancelEditCategory();
      triggerToast(`"${updatedCategory.name}" kategorisi başarıyla güncellendi!`);
    } else {
      if (categories.some(c => c.id === formattedId)) {
        setErrorMessage('Bu kategori kod ID’si sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3050);
        return;
      }

      if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
        setErrorMessage('Bu kategori adı sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3050);
        return;
      }

      const addedCategory: CategoryInfo = {
        id: formattedId,
        name: newCatName.trim(),
        iconName: newCatIcon,
        description: newCatDesc.trim() || `${newCatName.trim()} Spor Ekipmanları`,
        parentId: newCatParentId || undefined
      };

      onUpdateCategories([...categories, addedCategory]);
      handleCancelEditCategory();
      triggerToast(`"${addedCategory.name}" kategorisi başarıyla eklendi!`);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if (editingCategory && editingCategory.id === catId) {
      handleCancelEditCategory();
    }
    const updated = categories.filter(c => c.id !== catId);
    onUpdateCategories(updated);
    triggerToast('Kategori sistemden silindi.');
  };

  // KDV Rates Settings Handlers
  const handleStartEditKdv = (rate: number) => {
    setEditingKdv(rate);
    setEditingBrand(null);
    setEditingCategory(null);
    setNewKdvRate(rate);
  };

  const handleCancelEditKdv = () => {
    setEditingKdv(null);
    setNewKdvRate('');
  };

  const handleAddNewKdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKdvRate === '') return;
    const rateVal = Number(newKdvRate);

    if (editingKdv !== null) {
      if (rateVal !== editingKdv && kdvRates.includes(rateVal)) {
        setErrorMessage('Bu KDV oranı sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      const updatedKdv = kdvRates.map(r => r === editingKdv ? rateVal : r).sort((a, b) => b - a);
      onUpdateKdvRates(updatedKdv);

      if (rateVal !== editingKdv) {
        const updatedProducts = products.map(p => p.kdvRate === editingKdv ? { ...p, kdvRate: rateVal } : p);
        onUpdateProducts(updatedProducts);
      }

      handleCancelEditKdv();
      triggerToast(`KDV Oranı %${rateVal} başarıyla güncellendi!`);
    } else {
      if (kdvRates.includes(rateVal)) {
        setErrorMessage('Bu KDV oranı sistemde zaten mevcut.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      const updatedKdv = [...kdvRates, rateVal].sort((a, b) => b - a);
      onUpdateKdvRates(updatedKdv);
      handleCancelEditKdv();
      triggerToast(`KDV Oranı %${rateVal} başarıyla eklendi!`);
    }
  };

  const handleDeleteKdv = (rateVal: number) => {
    if (editingKdv === rateVal) {
      handleCancelEditKdv();
    }
    const updated = kdvRates.filter(r => r !== rateVal);
    onUpdateKdvRates(updated);
    triggerToast(`KDV Oranı %${rateVal} sistemden silindi.`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] border border-slate-100 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-505 bg-emerald-600 p-1.5 rounded-lg text-white">
                <Icons.Sliders className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">Sistem & Fiyat Yönetim Paneli</h2>
                <p className="text-[10px] text-slate-450 font-medium">Spor kıyafetleri ve ekipmanları fiyat kataloğunu, markaları, kategorileri ve KDV oranlarını canli düzenleyin</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icons.RotateCcw className="w-3.5 h-3.5" />
                Fabrikaya Dön
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-750 p-2 rounded-full cursor-pointer transition-all"
              >
                <Icons.X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Switcher */}
          <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex gap-3 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setModalTab('products')}
              className={`flex items-center gap-1.5 py-1.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                modalTab === 'products'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-205 hover:bg-slate-200'
              }`}
            >
              <Icons.Package className="w-4 h-4 text-emerald-500" />
              📦 Ürün Kataloğu Yönetimi
            </button>
            <button
              type="button"
              onClick={() => setModalTab('settings')}
              className={`flex items-center gap-1.5 py-1.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                modalTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-205 hover:bg-slate-200'
              }`}
            >
              <Icons.Settings className="w-4 h-4 text-emerald-500" />
              ⚙️ Marka, Kategori & KDV Ayarları
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {modalTab === 'products' ? (
              /* PRODUCTS MANAGEMENT TAB */
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Sidebar List (Left) */}
                <div className="w-80 border-r border-slate-100 p-4 flex flex-col gap-3 shrink-0 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Katalog ({products.length})</span>
                    <button
                      onClick={handleStartAddNew}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all uppercase cursor-pointer"
                    >
                      <Icons.Plus className="w-3 h-3" /> Ekle
                    </button>
                  </div>

                  {/* Quick Search */}
                  <div className="relative">
                    <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ürün ismi, marka ara..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Category selector */}
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl focus:outline-hidden"
                  >
                    <option value="Tümü">Tüm Kategoriler</option>
                    {categories.map(c => {
                      const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
                      const displayName = parent ? `${parent.name} › ${c.name}` : c.name;
                      return (
                        <option key={c.id} value={c.id}>{displayName}</option>
                      );
                    })}
                  </select>

                  {/* Dynamic scroll list of cards */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1">
                    {filteredAdminProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleStartEdit(p)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex gap-2 items-center ${
                          editingProduct?.id === p.id && !isAddingNew
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                            : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-slate-50 shrink-0 border border-slate-100" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-extrabold truncate leading-tight">{p.name}</div>
                          <div className="flex justify-between items-center mt-1 text-[10px]">
                            <span className={editingProduct?.id === p.id && !isAddingNew ? 'text-slate-300' : 'text-slate-400 font-medium'}>
                              {p.brand}
                            </span>
                            <span className={`font-black ${editingProduct?.id === p.id && !isAddingNew ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              {p.basePrice.toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                        </div>
                        {/* Delete button wrapper */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p.id);
                          }}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            editingProduct?.id === p.id && !isAddingNew
                              ? 'hover:bg-rose-500/30 text-rose-300'
                              : 'hover:bg-rose-50 text-rose-600'
                          }`}
                          title="Ürünü Kalıcı Olarak Sil"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {filteredAdminProducts.length === 0 && (
                      <div className="text-xs text-slate-400 text-center py-6">Eşleşen ürün bulunamadı.</div>
                    )}
                  </div>
                </div>

                {/* Editor Workspace (Right) */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  {editingProduct || isAddingNew ? (
                    <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col overflow-hidden">
                      
                      {/* Tab heads switcher */}
                      <div className="bg-slate-50 px-6 py-2 border-b border-slate-105 flex gap-4 shrink-0 overflow-x-auto">
                        {[
                          { id: 'info', name: 'Temel Bilgiler & Fiyat', icon: Icons.FileText },
                          { id: 'images', name: 'Çoklu Slayt Resimleri', icon: Icons.Image },
                          { id: 'specs', name: 'Teknik Özellikler (Specs)', icon: Icons.Database },
                          { id: 'options', name: 'Seçenek ve Opsiyonlar', icon: Icons.Settings2 },
                          { id: 'collars', name: 'Yaka Çeşitleri', icon: Icons.Layers }
                        ].map(t => {
                          const TabIcon = t.icon;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setActiveTab(t.id as any)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                activeTab === t.id
                                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <TabIcon className="w-3.5 h-3.5" />
                              {t.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* Main Scrollable form container */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {errorMessage && (
                          <div className="bg-rose-50 text-rose-800 text-xs py-2.5 px-4 rounded-xl border border-rose-100 font-semibold flex items-center gap-2">
                            <Icons.AlertTriangle className="w-4 h-4 text-rose-600" />
                            {errorMessage}
                          </div>
                        )}

                        {/* Tab: Info */}
                        {activeTab === 'info' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase">Ürün Adı *</label>
                                <input
                                  type="text"
                                  required
                                  value={formData.name}
                                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500"
                                  placeholder="Örn: Hummel Active Cotton Tee"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase">Kategori</label>
                                <select
                                  value={formData.category}
                                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-hidden"
                                >
                                  {categories.map(c => {
                                    const parent = c.parentId ? categories.find(parentCat => parentCat.id === c.parentId) : null;
                                    const displayName = parent ? `${parent.name} › ${c.name}` : c.name;
                                    return (
                                      <option key={c.id} value={c.id}>{displayName}</option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase">Spor Branşı</label>
                                <select
                                  value={formData.branch}
                                  onChange={e => setFormData(p => ({ ...p, branch: e.target.value }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
                                >
                                  {['Antrenman', 'Futbol', 'Basketbol', 'Voleybol', 'Hentbol', 'Koşu', 'Tenis', 'Genel Spor'].map(br => (
                                    <option key={br} value={br}>{br}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase">Marka</label>
                                <select
                                  value={formData.brand}
                                  onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 font-bold"
                                >
                                  {brands.map(b => (
                                    <option key={b.name} value={b.name}>{b.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase">Koleksiyon</label>
                                <input
                                  type="text"
                                  value={formData.collection}
                                  onChange={e => setFormData(p => ({ ...p, collection: e.target.value }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500"
                                  placeholder="Otantik Koleksiyon, Target, vb."
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-slate-100 pt-4">
                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase flex justify-between">
                                  <span>Taban Fiyat (TL) *</span>
                                  <span className="text-[10px] text-slate-450 font-mono normal-case">KDV Hariç</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={formData.basePrice}
                                  onChange={e => setFormData(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-550 uppercase">KDV Oranı (%)</label>
                                <select
                                  value={formData.kdvRate}
                                  onChange={e => setFormData(p => ({ ...p, kdvRate: parseInt(e.target.value) || 0 }))}
                                  className="w-full mt-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-bold"
                                >
                                  {kdvRates.map(rate => (
                                    <option key={rate} value={rate}>%{rate} KDV Oranı</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                              <label className="text-xs font-bold text-slate-550 uppercase">Ürün Detaylı Açıklaması</label>
                              <textarea
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                rows={3}
                                className="w-full mt-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-medium"
                                placeholder="Katalog detayında görüntülenecek açıklama..."
                              />
                            </div>

                            {/* Removed rating and popularity settings */}
                          </div>
                        )}

                        {/* Tab: Images with File Loader option */}
                        {activeTab === 'images' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-0.5">Çoklu Görsel / Slayt Yönetimi</h3>
                                <p className="text-[11px] text-slate-505 font-medium">Yerel dosya yükleyin veya uzak link girin. Slayt kaydırmalı animasyon için birden fazla görsel ekleyin.</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddImageUrlInput}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Icons.Plus className="w-3.5 h-3.5" /> Yeni Boş Slayt Ekle
                              </button>
                            </div>

                            <div className="space-y-3">
                              {formData.images.map((imgUrl, index) => (
                                <div key={index} className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-2xl border border-slate-105">
                                  <span className="text-xs font-extrabold text-slate-400 select-none bg-slate-200/60 w-6 h-6 flex items-center justify-center rounded-full mt-1">
                                    {index + 1}
                                  </span>
                                  
                                  <div className="flex-1 space-y-2">
                                    {/* URL input field */}
                                    <input
                                      type="text"
                                      value={imgUrl}
                                      onChange={e => handleImageChange(index, e.target.value)}
                                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-mono"
                                      placeholder="https://... uzak görsel adresi"
                                    />
                                    
                                    {/* Local File selection (Bu arada ürün resimlerini link dışında yükleme yönetimi yok mu?) */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">veya yerel resim dosyası seçin:</span>
                                      <label className="bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs">
                                        <Icons.UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                                        Görsel Dosyası Yükle
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              try {
                                                const compressed = await compressAndResizeImage(file);
                                                if (compressed) {
                                                  handleImageChange(index, compressed);
                                                }
                                              } catch (err) {
                                                console.error("Görsel yükleme hatası:", err);
                                              }
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {/* Preview Card */}
                                  {imgUrl.trim() !== '' && (
                                    <img
                                      src={imgUrl}
                                      alt=""
                                      className="w-12 h-12 object-cover rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=100';
                                      }}
                                    />
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImageUrlInput(index)}
                                    className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg shrink-0 cursor-pointer self-center"
                                  >
                                    <Icons.Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tab: Specs */}
                        {activeTab === 'specs' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="text-sm font-bold text-slate-800">Teknik Özellik Tablosu</h3>
                                <p className="text-[11px] text-slate-500 font-medium font-sans">Kullanıcının detay tablosunda gördüğü kumaş, kesim veya özel tasarım verileri</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddSpecRow}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer"
                              >
                                <Icons.Plus className="w-3.5 h-3.5" /> Satır Ekle
                              </button>
                            </div>

                            <div className="space-y-2">
                              {formData.specs.map((spec, index) => (
                                <div key={index} className="flex gap-2.5 items-center">
                                  <input
                                    type="text"
                                    placeholder="Kumaş, Detay vb."
                                    value={spec.key}
                                    onChange={e => handleSpecKeyChange(index, e.target.value)}
                                    className="w-1/3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                                  />
                                  <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                  <input
                                    type="text"
                                    placeholder="Değer girin..."
                                    value={spec.val}
                                    onChange={e => handleSpecValChange(index, e.target.value)}
                                    className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSpecRow(index)}
                                    className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg shrink-0 cursor-pointer"
                                  >
                                    <Icons.Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tab: Options */}
                        {activeTab === 'options' && (
                          <div className="space-y-5">
                            <div className="flex justify-between items-center border-b border-slate-105 pb-3">
                              <div>
                                <h3 className="text-sm font-bold text-slate-800">Seçenek Alternatifleri</h3>
                                <p className="text-[11px] text-slate-500 font-medium">Beden, Renk veya ekstra eklemeler yapıp her kombinasyon için fiyat farkı atayabilirsiniz.</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddOption}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Icons.Plus className="w-3.5 h-3.5" /> Yeni Seçenek Tipi Ekle
                              </button>
                            </div>

                            <div className="space-y-5">
                              {formData.options.map((opt, optIndex) => (
                                <div key={opt.id || optIndex} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                                  <div className="flex justify-between items-center bg-slate-100 -mx-4 -mt-4 p-3 rounded-t-2xl border-b border-slate-200">
                                    <div className="flex-1 max-w-sm">
                                      <input
                                        type="text"
                                        required
                                        value={opt.name}
                                        onChange={e => handleOptionNameChange(optIndex, e.target.value)}
                                        className="bg-white py-1 px-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 w-full"
                                        placeholder="Seçenek Adı (Örn: Beden)"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(optIndex)}
                                      className="py-1 px-2 bg-rose-50 border border-rose-100 hover:bg-rose-150 text-rose-600 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-0.5"
                                    >
                                      <Icons.XCircle className="w-3.5 h-3.5" /> Seçeneği Kaldır
                                    </button>
                                  </div>

                                  {/* Sub Choices list */}
                                  <div className="bg-white rounded-xl p-3 border border-slate-200/50 space-y-2.5">
                                    <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Seçim Alternatifleri</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddChoice(optIndex)}
                                        className="text-emerald-700 hover:text-emerald-805 font-black text-[10px] flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Icons.PlusCircle className="w-3.5 h-3.5" /> Alternatif Ekle
                                      </button>
                                    </div>

                                    {opt.choices.map((choice, choiceIndex) => (
                                      <div key={choiceIndex} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          required
                                          placeholder="Seçgili isim (Örn: XL Beden)"
                                          value={choice.name}
                                          onChange={e => handleChoiceNameChange(optIndex, choiceIndex, e.target.value)}
                                          className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                                        />
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Fiyat Farkı:</span>
                                          <input
                                            type="number"
                                            placeholder="0"
                                            value={choice.priceInfluence}
                                            onChange={e => handleChoicePriceChange(optIndex, choiceIndex, parseFloat(e.target.value) || 0)}
                                            className="w-20 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold text-emerald-800"
                                          />
                                          <span className="text-xs font-semibold text-slate-450">TL</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveChoice(optIndex, choiceIndex)}
                                          className="p-1 px-1.5 text-rose-500 hover:bg-rose-55 rounded-md cursor-pointer transition-colors"
                                        >
                                          <Icons.Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                    {opt.choices.length === 0 && (
                                      <div className="text-[10px] text-slate-400 italic">Hiç alternatif seçenek eklenmedi.</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {formData.options.length === 0 && (
                                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-150 text-xs text-slate-400">
                                  Hiç alternatif seçenek bulunmamaktadır.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === 'collars' && (
                          <div className="space-y-4">
                            {/* Header Section */}
                            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="text-left">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Icons.Layers className="w-4 h-4 text-emerald-600" />
                                  Yaka Çeşitleri Yapılandırması
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                                  Bu üründe sunulacak yaka tiplerinin aktiflik durumlarını, fiyat farklarını, etiket değerlerini ve açıklamalarını yönetin.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddNewCollar}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Icons.Plus className="w-3.5 h-3.5 font-bold" /> Yeni Yaka Stili Ekle
                              </button>
                            </div>

                            {/* Collars List */}
                            <div className="space-y-3">
                              {(formData.collarOptions || []).map((collar, idx) => {
                                // Dynamically resolve the icon component
                                const SelectedIconComponent = (Icons as any)[collar.iconKey] || Icons.HelpCircle;

                                return (
                                  <div
                                    key={idx}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center ${
                                      collar.enabled
                                        ? 'bg-white border-slate-200/80 shadow-2xs'
                                        : 'bg-slate-50/50 border-slate-200/40 opacity-70'
                                    }`}
                                  >
                                    {/* Left: Checkbox Activation */}
                                    <div className="flex items-center gap-3 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCollar(idx)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                                          collar.enabled
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                        title={collar.enabled ? "Aktif (Üründe Gösterilir)" : "Pasif (Gizli)"}
                                      >
                                        {collar.enabled ? (
                                          <Icons.Check className="w-5 h-5 stroke-[3px]" />
                                        ) : (
                                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                                        )}
                                      </button>
                                      <div className="flex flex-col text-left">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Durum</span>
                                        <span className={`text-[10px] font-black ${collar.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                                          {collar.enabled ? 'AKTİF' : 'PASİF'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Icon Display & Quick Picker */}
                                    <div className="flex flex-col gap-1.5 shrink-0 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/40">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                          <SelectedIconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">İkon Sınıfı</span>
                                          <span className="text-[9.5px] font-mono font-bold text-slate-700">{collar.iconKey}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Mini picker */}
                                      <div className="grid grid-cols-4 gap-1 mt-1">
                                        {[
                                          { key: 'Layers', icon: Icons.Layers },
                                          { key: 'Maximize', icon: Icons.Maximize },
                                          { key: 'Award', icon: Icons.Award },
                                          { key: 'ShieldCheck', icon: Icons.ShieldCheck },
                                          { key: 'Sparkles', icon: Icons.Sparkles },
                                          { key: 'Shirt', icon: Icons.Shirt },
                                          { key: 'Flame', icon: Icons.Flame },
                                          { key: 'Heart', icon: Icons.Heart }
                                        ].map(ico => {
                                          const MiniIcon = ico.icon;
                                          const isActive = collar.iconKey === ico.key;
                                          return (
                                            <button
                                              key={ico.key}
                                              type="button"
                                              onClick={() => handleUpdateCollarField(idx, 'iconKey', ico.key)}
                                              className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-all border shrink-0 cursor-pointer ${
                                                isActive
                                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                              }`}
                                              title={ico.key}
                                            >
                                              <MiniIcon className="w-3 h-3" />
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Middle: Details Inputs */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="text-left">
                                          <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Yaka İsmi</label>
                                          <input
                                            type="text"
                                            required
                                            value={collar.name}
                                            onChange={e => handleUpdateCollarField(idx, 'name', e.target.value)}
                                            className="w-full mt-0.5 py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 font-sans"
                                            placeholder="Örn: Örme Bisiklet Yaka"
                                          />
                                        </div>
                                        <div className="text-left">
                                          <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Yaka Etiketi / Badge</label>
                                          <input
                                            type="text"
                                            value={collar.tag}
                                            onChange={e => handleUpdateCollarField(idx, 'tag', e.target.value)}
                                            className="w-full mt-0.5 py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 font-sans"
                                            placeholder="Örn: En Popüler"
                                          />
                                        </div>
                                      </div>
                                      <div className="text-left">
                                        <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block font-sans">Açıklama Metni</label>
                                        <input
                                          type="text"
                                          value={collar.desc}
                                          onChange={e => handleUpdateCollarField(idx, 'desc', e.target.value)}
                                          className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 focus:ring-1 focus:ring-emerald-500 font-sans"
                                          placeholder="Seçim ekranında görünecek açıklayıcı metin..."
                                        />
                                      </div>
                                    </div>

                                    {/* Right: Cost Influence & Delete */}
                                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                      <div className="flex flex-col w-24 text-left">
                                        <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Fiyat Farkı (TL)</label>
                                        <div className="relative mt-0.5 font-sans">
                                          <input
                                            type="number"
                                            value={collar.priceInfluence}
                                            onChange={e => handleUpdateCollarField(idx, 'priceInfluence', Number(e.target.value) || 0)}
                                            className="w-full py-1 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 text-right font-sans"
                                          />
                                          <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 font-sans">TL</span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCollar(idx)}
                                        className="mt-4 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer self-center"
                                        title="Yaka Çeşidini Sil"
                                      >
                                        <Icons.Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                              {formData.collarOptions.length === 0 && (
                                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-405">
                                  Hiçbir yaka çeşidi tanımlı değil. Yeni bir tane eklemek için sağ üstteki butona tıklayın!
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Form Footer Action */}
                      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                        <span className="text-[10px] text-slate-450 mr-auto font-medium font-mono">Kimlik ID: <strong>{formData.id}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setIsAddingNew(false);
                          }}
                          className="border border-slate-250 text-slate-650 font-bold text-xs py-2 px-4 rounded-xl hover:bg-slate-100 cursor-pointer select-none transition-all"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Icons.Save className="w-4 h-4" />
                          Değişiklikleri Kaydet
                        </button>
                      </div>

                    </form>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/40 p-8 text-center select-none">
                      <div className="bg-slate-100 p-4 rounded-full text-slate-350 mb-3 border border-slate-200/50">
                        <Icons.MousePointer className="w-10 h-10" />
                      </div>
                      <h3 className="font-extrabold text-slate-700 text-sm">Düzenleme Yapmak İçin Ürün Seçin</h3>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">Sol taraftaki katalog listesinden düzenlemek istediğiniz ürünü seçebilir veya sağ üstteki "+ Ekle" butonundan yeni bir ürün ekleyebilirsiniz.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* DYNAMIC SETTINGS TAB (MARKALAR, KATEGORILER VE KDV'LER) */
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 font-sans">
                {errorMessage && (
                  <div className="mb-4 bg-rose-50 text-rose-800 text-xs py-2.5 px-4 rounded-xl border border-rose-100 font-semibold flex items-center gap-2">
                    <Icons.AlertTriangle className="w-4 h-4 text-rose-600" />
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 1. BRAND MANAGEMENT (Marka Seçenekleri) */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col h-[65vh]">
                    <div className="border-b border-slate-100 pb-3 mb-4 shrink-0 flex items-center gap-2">
                      <Icons.Tag className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-none">1. Marka Özelleştirme</h3>
                        <p className="text-[10px] text-slate-405 font-medium mt-1">Katalogda listelenecek markalar & logoları</p>
                      </div>
                    </div>

                    {/* Brand List Scrollable Area */}
                    <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-2">
                      {brands.map(b => (
                        <div key={b.name} className={`flex items-center justify-between p-2.5 rounded-xl border bg-slate-50/50 ${editingBrand?.name === b.name ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {b.logo && (b.logo.startsWith('http') || b.logo.startsWith('data:image')) ? (
                              <img src={b.logo} alt="" className="w-8 h-8 object-contain rounded bg-white p-1 border border-slate-150 shrink-0" />
                            ) : (
                              <span className="w-8 h-8 rounded bg-slate-900 text-white font-extrabold text-[8px] flex items-center justify-center shrink-0 tracking-tighter uppercase leading-none">
                                {b.logo}
                              </span>
                            )}
                            <div className="truncate">
                              <div className="text-xs font-extrabold text-slate-800 leading-none">{b.name}</div>
                              <span className="text-[9px] text-slate-400 font-medium font-mono">{b.origin}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditBrand(b)}
                              className="p-1 px-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                              title="Markayı Düzenle"
                            >
                              <Icons.Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBrand(b.name)}
                              className="p-1 px-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="Markayı Sistemden Kaldır"
                            >
                              <Icons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add/Edit Brand Form */}
                    <form onSubmit={handleAddNewBrand} className="bg-slate-50 p-3 rounded-xl border border-slate-200/55 shrink-0 space-y-2">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">
                        {editingBrand ? `MARKA DÜZENLE: ${editingBrand.name}` : 'YENİ MARKA EKLE'}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Marka Adı (Örn: Hummel)"
                        value={newBrandName}
                        onChange={e => setNewBrandName(e.target.value)}
                        className="bg-white py-1.5 px-3 border border-slate-300 rounded-lg text-xs w-full font-bold"
                      />
                      
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Logo URL'si veya boş bırakın"
                          value={newBrandLogo}
                          onChange={e => setNewBrandLogo(e.target.value)}
                          className="bg-white py-1 px-3 border border-slate-205 rounded-lg text-[10px] w-full font-mono"
                        />
                        {/* File upload for brand logo */}
                        <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-150 text-[10px]">
                          <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">veya görsel seçin:</span>
                          <label className="bg-slate-100 hover:bg-slate-250 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold px-2 py-0.5 rounded-md cursor-pointer transition-all border border-slate-200">
                            Yükle
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressAndResizeImage(file);
                                    if (compressed) {
                                      setNewBrandLogo(compressed);
                                    }
                                  } catch (err) {
                                    console.error("Logo yükleme hatası:", err);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        {newBrandLogo && (
                          <div className="flex items-center gap-1.5 p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="text-[9px] text-emerald-805 font-bold">Resim Hazır</span>
                            <button
                              type="button"
                              onClick={() => setNewBrandLogo('')}
                              className="text-rose-600 text-[9px] underline font-semibold ml-auto hover:text-rose-700"
                            >
                              Sıfırla
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Köken (Türkiye)"
                          value={newBrandOrigin}
                          onChange={e => setNewBrandOrigin(e.target.value)}
                          className="bg-white py-1 px-2.5 border border-slate-205 rounded-lg text-[10px] flex-1"
                        />
                        <div className="flex gap-1 shrink-0">
                          {editingBrand && (
                            <button
                              type="button"
                              onClick={handleCancelEditBrand}
                              className="border border-slate-350 hover:bg-slate-200 text-slate-705 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              Vazgeç
                            </button>
                          )}
                          <button
                            type="submit"
                            className="bg-slate-900 text-white font-extrabold text-[10px] px-3.5 py-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            {editingBrand ? 'Kaydet' : 'Ekle'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* 2. CATEGORY MANAGEMENT */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col h-[65vh]">
                    <div className="border-b border-slate-100 pb-3 mb-4 shrink-0 flex items-center gap-2">
                      <Icons.Layers className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-none">2. Kategori Özelleştirme</h3>
                        <p className="text-[10px] text-slate-405 font-medium mt-1">Kategori hiyerarşisi oluşturun ve düzenleyin</p>
                      </div>
                    </div>

                    {/* Category List Scroll Area */}
                    <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-2">
                      {categories.map(cat => {
                        const IconComponent = (Icons as any)[cat.iconName] || Icons.HelpCircle;
                        const parentCat = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
                        return (
                          <div key={cat.id} className={`flex items-center justify-between p-2.5 rounded-xl border bg-slate-50/55 ${editingCategory?.id === cat.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100/60 text-emerald-820 flex items-center justify-center shrink-0">
                                <IconComponent className="w-4 h-4" />
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-extrabold text-slate-800 leading-none">{cat.name}</span>
                                <div className="text-[9px] text-slate-405 font-mono font-bold leading-none mt-1 flex flex-wrap items-center gap-1">
                                  <span>Kod ID: {cat.id}</span>
                                  {parentCat && (
                                    <span className="text-[8px] flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100/50">
                                      <Icons.CornerDownRight className="w-2 h-2" />
                                      {parentCat.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-1 px-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                                title="Kategoriyi Düzenle"
                              >
                                <Icons.Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 px-1.5 hover:bg-rose-50 text-rose-650 rounded-lg cursor-pointer"
                                title="Kategoriyi Sistemden Kaldır"
                              >
                                <Icons.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add/Edit Category Form */}
                    <form onSubmit={handleAddNewCategory} className="bg-slate-50 p-3 rounded-xl border border-slate-205 shrink-0 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">
                        {editingCategory ? `KATEGORİ DÜZENLE: ${editingCategory.name}` : 'YENİ KATEGORİ EKLE'}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Slug ID (örn: sort)"
                          value={newCatId}
                          onChange={e => setNewCatId(e.target.value)}
                          className="bg-white py-1 px-2 border border-slate-300 rounded-lg text-[10px] font-mono"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Görsel İsim (Şort)"
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          className="bg-white py-1 px-2 border border-slate-300 rounded-lg text-[10px] font-bold"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Üst Ana Kategori (Varsa)</label>
                        <select
                          value={newCatParentId}
                          onChange={e => setNewCatParentId(e.target.value)}
                          className="bg-white py-1 px-2 border border-slate-300 text-[10px] font-medium rounded-lg w-full focus:outline-hidden"
                        >
                          <option value="">-- Yok / Bağımsız Ana Kategori --</option>
                          {categories
                            .filter(c => !c.parentId && c.id !== editingCategory?.id)
                            .map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Görsel Simge (Ikon)</label>
                        <div className="flex gap-2 items-center justify-between">
                          <select
                            value={newCatIcon}
                            onChange={e => setNewCatIcon(e.target.value)}
                            className="bg-white py-1.5 px-2 border border-slate-250 text-[10px] font-semibold rounded-lg flex-1"
                          >
                            <option value="Shirt">👕 Shirt (Üst Giyim)</option>
                            <option value="Footprints">👣 Footprints (Ayakkabı)</option>
                            <option value="Dumbbell">🏋️ Dumbbell (Ağırlık)</option>
                            <option value="Activity">⚡ Activity (Kardiyo)</option>
                            <option value="Backpack">🎒 Backpack (Aksesuar)</option>
                            <option value="Trophy">🏆 Trophy (Ekipman)</option>
                            <option value="Sparkles">✨ Sparkles (Koleksiyon)</option>
                          </select>
                          <div className="flex gap-1 shrink-0">
                            {editingCategory && (
                              <button
                                type="button"
                                onClick={handleCancelEditCategory}
                                className="border border-slate-350 hover:bg-slate-200 text-slate-750 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                Vazgeç
                              </button>
                            )}
                            <button
                              type="submit"
                              className="bg-slate-900 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                            >
                              {editingCategory ? 'Kaydet' : 'Ekle'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* 3. TAX (KDV) RATES MANAGEMENT */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col h-[65vh]">
                    <div className="border-b border-slate-100 pb-3 mb-4 shrink-0 flex items-center gap-2">
                      <Icons.Percent className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-none">3. KDV Oranları Özelleştirme</h3>
                        <p className="text-[10px] text-slate-405 font-medium mt-1">Ürünlerinize dynamic KDV oranları atayın</p>
                      </div>
                    </div>

                    {/* KDV List scrollable area */}
                    <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-2">
                      {kdvRates.map(rate => (
                        <div key={rate} className={`flex items-center justify-between p-2.5 rounded-xl border bg-slate-50/50 ${editingKdv === rate ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              %{rate}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-800">Vergi Katmanı Oranı</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditKdv(rate)}
                              className="p-1 px-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                              title="KDV Oranını Düzenle"
                            >
                              <Icons.Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKdv(rate)}
                              className="p-1 px-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="KDV Oranını Kaldır"
                            >
                              <Icons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add KDV Rate Form */}
                    <form onSubmit={handleAddNewKdv} className="bg-slate-50 p-3 rounded-xl border border-slate-205 shrink-0 space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-450 uppercase block tracking-wide">
                        {editingKdv !== null ? `KDV KATMANINI DÜZENLE: %${editingKdv}` : 'YENİ KDV KATMANI EKLE'}
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          placeholder="Vergi yüzdesi (Örn: 18)"
                          value={newKdvRate}
                          onChange={e => setNewKdvRate(e.target.value !== '' ? parseInt(e.target.value) : '')}
                          className="bg-white py-1.5 px-3 border border-slate-300 rounded-lg text-xs flex-1 font-bold"
                        />
                        <div className="flex gap-1 shrink-0">
                          {editingKdv !== null && (
                            <button
                              type="button"
                              onClick={handleCancelEditKdv}
                              className="border border-slate-350 hover:bg-slate-200 text-slate-705 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Vazgeç
                            </button>
                          )}
                          <button
                            type="submit"
                            className="bg-slate-900 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            {editingKdv !== null ? 'Kaydet' : 'Vergi Ekle'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom overlays for deletion, reset, error and successes */}
          <AnimatePresence>
            {productToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 rounded-3xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-100"
                >
                  <div className="bg-rose-50 text-rose-600 p-3.5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Icons.Trash2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Ürünü Silmek İstiyor musunuz?</h4>
                  <p className="text-xs text-slate-505 mt-2">Bu ürün katalogdan kalıcı olarak silinecektir. Bu işlem geri alınamaz.</p>
                  <div className="flex gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => setProductToDelete(null)}
                      className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 px-4 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedList = products.filter(p => p.id !== productToDelete);
                        onUpdateProducts(updatedList);
                        if (editingProduct?.id === productToDelete) {
                          setEditingProduct(null);
                        }
                        setProductToDelete(null);
                        triggerToast('Ürün başarıyla silindi.');
                      }}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 px-4 font-bold text-xs cursor-pointer"
                    >
                      Evet, Sil
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showResetConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 rounded-3xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white p-6 rounded-3xl max-w-md w-full text-center shadow-2xl border border-slate-100"
                >
                  <div className="bg-amber-50 text-amber-600 p-3.5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Icons.RotateCcw className="w-6 h-6 animate-spin" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Sistemi Fabrika Ayarlarına Sıfırla</h4>
                  <p className="text-xs text-slate-500 mt-2">Bütün sonradan eklediğiniz ürünler, özelleştirilmiş markalar (ve logoları), özel kategoriler ve tanımladığınız KDV oranları silinecek, başlangıç katalog verileri geri yüklenecektir. Emin misiniz?</p>
                  <div className="flex gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 px-4 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetToDefaults();
                        setEditingProduct(null);
                        setIsAddingNew(false);
                        setShowResetConfirm(false);
                        setModalTab('products');
                        triggerToast('Sistem başarıyla fabrika ayarlarına sıfırlandı.');
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2 px-4 font-bold text-xs cursor-pointer"
                    >
                      Evet, Sıfırla
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Custom Toast Indicator */}
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="absolute bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 z-[60]"
              >
                <span className="bg-emerald-500 p-1 rounded-full text-slate-950 font-black"><Icons.Check className="w-3 h-3" /></span>
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
