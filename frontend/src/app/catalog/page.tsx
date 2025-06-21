'use client'

import React, { useState } from 'react';
import { 
  Layout, 
  Input, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Checkbox, 
  Divider, 
  Select, 
  Button,
  Slider,
  Rate,
  Dropdown,
  Space,
  Menu,
  MenuProps
} from 'antd';
import { 
  SearchOutlined, 
  SortAscendingOutlined, 
  SortDescendingOutlined, 
  StarOutlined, 
  FireOutlined,
  DownOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'next/navigation';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;
const { Group: CheckboxGroup } = Checkbox;

// Mock product data
const products = [
  {
    id: 1,
    title: 'Пополнение STEAM 24/7 РФ, СНГ',
    price: 1.09,
    image: 'https://placehold.co/300x200/1677ff/white?text=STEAM',
    platform: 'Steam',
    rating: 4.9,
    sales: 323492,
    type: 'Пополнение'
  },
  {
    id: 2,
    title: 'PlayStation Network (PSN) - $10 (USA)',
    price: 12.50,
    image: 'https://placehold.co/300x200/0070d1/white?text=PSN',
    platform: 'PlayStation',
    rating: 4.8,
    sales: 157834,
    type: 'Пополнение'
  },
  {
    id: 3,
    title: 'Xbox Game Pass Ultimate - 1 месяц',
    price: 9.99,
    image: 'https://placehold.co/300x200/107c10/white?text=Xbox',
    platform: 'Xbox',
    rating: 4.7,
    sales: 98521,
    type: 'Подписка'
  },
  {
    id: 4,
    title: 'Nintendo Switch Online - 12 месяцев',
    price: 19.99,
    image: 'https://placehold.co/300x200/e60012/white?text=Nintendo',
    platform: 'Nintendo Switch',
    rating: 4.6,
    sales: 76543,
    type: 'Подписка'
  },
  {
    id: 5,
    title: 'Epic Games Store - $25 Gift Card',
    price: 25.00,
    image: 'https://placehold.co/300x200/2a2a2a/white?text=Epic',
    platform: 'Epic Games',
    rating: 4.5,
    sales: 54321,
    type: 'Подарочная карта'
  },
  {
    id: 6,
    title: 'Grand Theft Auto V: Premium Edition',
    price: 29.99,
    image: 'https://placehold.co/300x200/000000/white?text=GTA+V',
    platform: 'Steam',
    rating: 4.8,
    sales: 987654,
    type: 'Игра'
  },
  {
    id: 7,
    title: 'Microsoft Office 365 - 1 год',
    price: 69.99,
    image: 'https://placehold.co/300x200/d83b01/white?text=Office',
    platform: 'Microsoft Office',
    rating: 4.7,
    sales: 123456,
    type: 'Программа'
  },
  {
    id: 8,
    title: 'Discord Nitro - 1 месяц',
    price: 9.99,
    image: 'https://placehold.co/300x200/5865f2/white?text=Discord',
    platform: 'Discord',
    rating: 4.6,
    sales: 234567,
    type: 'Подписка'
  }
];

// Platform filter options
const platformOptions = [
  { label: 'Steam', value: 'Steam' },
  { label: 'PlayStation', value: 'PlayStation' },
  { label: 'Xbox', value: 'Xbox' },
  { label: 'Nintendo Switch', value: 'Nintendo Switch' },
  { label: 'Epic Games', value: 'Epic Games' },
  { label: 'Discord', value: 'Discord' },
  { label: 'Microsoft Office', value: 'Microsoft Office' }
];

// Content type filter options
const contentTypeOptions = [
  { label: 'Игра', value: 'Игра' },
  { label: 'Пополнение', value: 'Пополнение' },
  { label: 'Подписка', value: 'Подписка' },
  { label: 'Подарочная карта', value: 'Подарочная карта' },
  { label: 'Программа', value: 'Программа' }
];

// Sort options
const sortOptions = [
  { label: 'По умолчанию', value: 'popularity', icon: <MenuOutlined /> },
  { label: 'Количество продаж', value: 'sales', icon: <FireOutlined /> },
  { label: 'Дешевле', value: 'price-asc', icon: <SortAscendingOutlined /> },
  { label: 'Дороже', value: 'price-desc', icon: <SortDescendingOutlined /> },
  { label: 'По рейтингу', value: 'rating', icon: <StarOutlined /> }
];

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('popularity');

  // Filter products based on all filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(product.platform);
    const matchesContentType = selectedContentTypes.length === 0 || selectedContentTypes.includes(product.type);
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesRating = product.rating >= minRating;
    
    return matchesSearch && matchesPlatform && matchesContentType && matchesPrice && matchesRating;
  });

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'sales':
        return b.sales - a.sales;
      case 'popularity':
      default:
        return b.sales - a.sales;
    }
  });

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPlatforms([]);
    setSelectedContentTypes([]);
    setPriceRange([0, 100]);
    setMinRating(0);
  };

  // Generate the sort dropdown menu
  const sortMenu = (
    <Menu 
      selectedKeys={[sortBy]}
      onClick={(e) => setSortBy(e.key)}
      items={sortOptions.map(option => ({
        key: option.value,
        label: (
          <Space>
            {option.icon}
            <span>{option.label}</span>
          </Space>
        ),
      }))}
    />
  );

  // Создаем объект MenuProps для Dropdown
  const menuProps: MenuProps = {
    items: sortOptions.map(option => ({
      key: option.value,
      label: (
        <Space>
          {option.icon}
          <span>{option.label}</span>
        </Space>
      ),
    })),
    onClick: (e) => setSortBy(e.key),
    selectedKeys: [sortBy],
  };

  const currentSortOption = sortOptions.find(option => option.value === sortBy);

  return (
    <Layout className="catalog-layout">
      <Layout className="catalog-content-layout">
        <Sider width={280} theme="light" className="catalog-sider">
          <div className="catalog-filters">
            <Title level={4}>Фильтры</Title>
            
            <Divider />
            
            <div className="filter-section">
              <Title level={5}>Поиск</Title>
              <Input
                placeholder="Поиск товаров..."
                prefix={<SearchOutlined />}
                className="filter-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Divider />
            
            <div className="filter-section">
              <Title level={5}>Платформа</Title>
              <CheckboxGroup
                options={platformOptions}
                value={selectedPlatforms}
                onChange={(values) => setSelectedPlatforms(values as string[])}
                className="platform-checkbox-group"
              />
            </div>
            
            <Divider />
            
            <div className="filter-section">
              <Title level={5}>Тип контента</Title>
              <CheckboxGroup
                options={contentTypeOptions}
                value={selectedContentTypes}
                onChange={(values) => setSelectedContentTypes(values as string[])}
                className="content-type-checkbox-group"
              />
            </div>
            
            <Divider />
            
            <div className="filter-section">
              <Title level={5}>Цена ($)</Title>
              <Slider
                range
                min={0}
                max={100}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
                className="price-slider"
              />
              <div className="price-range-display">
                <Text>${priceRange[0]}</Text>
                <Text>${priceRange[1]}</Text>
              </div>
            </div>
            
            <Divider />
            
            <div className="filter-section">
              <Title level={5}>Минимальный рейтинг</Title>
              <Rate 
                allowHalf 
                value={minRating} 
                onChange={setMinRating} 
                className="rating-filter"
              />
              <Text className="selected-rating">{minRating} и выше</Text>
            </div>
            
            <Divider />
            
            <Button 
              type="primary" 
              block 
              onClick={resetFilters}
              disabled={
                searchQuery === '' && 
                selectedPlatforms.length === 0 && 
                selectedContentTypes.length === 0 && 
                priceRange[0] === 0 && 
                priceRange[1] === 100 &&
                minRating === 0
              }
            >
              Сбросить фильтры
            </Button>
          </div>
        </Sider>
        
        <Content className="catalog-main-content">
          <div className="catalog-header">
            <Title level={3}>Все товары ({sortedProducts.length})</Title>
            <Dropdown 
              menu={menuProps} 
              trigger={['click']}
              placement="bottomRight"
            >
              <Button className="sort-dropdown-button">
                <Space>
                  {currentSortOption?.icon}
                  {currentSortOption?.label}
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </div>
          
          <Row gutter={[16, 24]}>
            {sortedProducts.map(product => (
              <Col xs={24} sm={12} md={8} lg={8} xl={6} key={product.id}>
                <Card
                  hoverable
                  cover={<img alt={product.title} src={product.image} />}
                  className="product-card"
                >
                  <Meta
                    title={product.title}
                    description={
                      <div className="product-meta">
                        <Text strong className="product-price">${product.price.toFixed(2)}</Text>
                        <div className="product-info">
                          <Text type="secondary" className="product-platform">{product.platform}</Text>
                          <Text type="secondary" className="product-type">{product.type}</Text>
                        </div>
                        <div className="product-stats">
                          <Rate disabled defaultValue={product.rating} allowHalf className="product-rating" />
                          <Text type="secondary">Продаж: {product.sales.toLocaleString()}</Text>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
} 