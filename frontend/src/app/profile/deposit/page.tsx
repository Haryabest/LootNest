'use client';

import React, { useState } from 'react';
import { Card, Typography, Input, Button, Form, Select, Divider, Alert, Steps } from 'antd';
import { WalletOutlined, CreditCardOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function DepositPage() {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const router = useRouter();

  // Предустановленные суммы для быстрого выбора
  const presetAmounts = [500, 1000, 2000, 5000];

  // Функция для обработки пополнения
  const handleDeposit = () => {
    setIsLoading(true);
    
    // Имитация API запроса с задержкой
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(1);
    }, 1500);
  };

  // Шаги процесса пополнения
  const steps = [
    {
      title: 'Заполнение',
      content: (
        <div className="deposit-form">
          <Form layout="vertical">
            <Form.Item label="Выберите способ оплаты" required>
              <Select 
                value={paymentMethod}
                onChange={setPaymentMethod}
                style={{ width: '100%' }}
              >
                <Option value="card">Банковская карта</Option>
                <Option value="bank">Банковский перевод</Option>
                <Option value="qiwi">QIWI</Option>
                <Option value="yoomoney">ЮMoney</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Сумма пополнения" required>
              <Input
                addonAfter="₽"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Введите сумму"
                type="text"
                min={1}
                style={{ width: '100%' }}
              />
              <div className="preset-amounts">
                {presetAmounts.map(preset => (
                  <Button 
                    key={preset} 
                    onClick={() => setAmount(preset.toString())}
                    type={amount === preset.toString() ? 'primary' : 'default'}
                    style={{ margin: '8px 4px 0 0' }}
                  >
                    {preset} ₽
                  </Button>
                ))}
              </div>
            </Form.Item>

            <Divider />
            
            <div className="deposit-summary">
              <div className="summary-row">
                <Text>Сумма пополнения:</Text>
                <Text strong>{amount || 0} ₽</Text>
              </div>
              <div className="summary-row">
                <Text>Комиссия:</Text>
                <Text type="secondary">0 ₽</Text>
              </div>
              <div className="summary-row">
                <Text strong>К зачислению:</Text>
                <Text strong style={{ fontSize: '16px', color: '#1677ff' }}>{amount || 0} ₽</Text>
              </div>
            </div>
            
            <Form.Item style={{ marginTop: 20, textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<WalletOutlined />}
                onClick={handleDeposit}
                loading={isLoading}
                disabled={!amount || parseFloat(amount) <= 0}
                style={{ width: '80%' }}
              >
                Пополнить
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      title: 'Подтверждение',
      content: (
        <div className="deposit-success">
          <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', margin: '20px 0' }} />
          <Title level={3}>Перенаправление на оплату</Title>
          <Paragraph>
            Сейчас вы будете перенаправлены на страницу платежной системы для завершения оплаты.
          </Paragraph>
          <Alert 
            type="info" 
            message="После совершения платежа средства будут зачислены на ваш баланс автоматически."
            style={{ marginTop: '20px', marginBottom: '20px' }}
          />
          <Button 
            type="primary" 
            onClick={() => router.push('/profile')}
            style={{ margin: '10px' }}
          >
            Вернуться в профиль
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="deposit-page">
      <Card 
        title={<Title level={3}>Пополнение баланса</Title>}
        className="deposit-card"
        bordered={false}
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
        <div className="steps-content">{steps[currentStep].content}</div>
      </Card>
    </div>
  );
} 