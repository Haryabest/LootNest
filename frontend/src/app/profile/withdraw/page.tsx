'use client';

import React, { useState } from 'react';
import { Card, Typography, Input, Button, Form, Select, Divider, Alert, Steps, message } from 'antd';
import { WalletOutlined, CreditCardOutlined, BankOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function WithdrawPage() {
  const [amount, setAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<string>('card');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [withdrawDetails, setWithdrawDetails] = useState<string>('');
  const router = useRouter();
  
  // Текущий баланс пользователя (в реальном проекте получать из API)
  const currentBalance = 0;
  
  // Предустановленные суммы для быстрого выбора
  const presetAmounts = [100, 500, 1000, 'all'];

  // Комиссия за вывод (в процентах)
  const commissionRate = 2;

  // Функция для обработки вывода
  const handleWithdraw = () => {
    if (!withdrawDetails) {
      message.error('Необходимо указать реквизиты для вывода средств');
      return;
    }
    
    // Проверка суммы
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      message.error('Укажите корректную сумму для вывода');
      return;
    }
    
    if (withdrawAmount > currentBalance) {
      message.error('Недостаточно средств для вывода');
      return;
    }
    
    setIsLoading(true);
    
    // Имитация API запроса с задержкой
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(1);
    }, 1500);
  };

  // Расчет комиссии
  const calculateCommission = () => {
    if (!amount) return 0;
    return Math.round((parseFloat(amount) * commissionRate) / 100);
  };

  // Расчет суммы к выводу
  const calculateFinalAmount = () => {
    if (!amount) return 0;
    const commission = calculateCommission();
    return parseFloat(amount) - commission;
  };

  // Установка максимальной доступной суммы
  const setMaxAmount = () => {
    setAmount(currentBalance.toString());
  };

  // Шаги процесса вывода
  const steps = [
    {
      title: 'Заявка',
      content: (
        <div className="withdraw-form">
          <Form layout="vertical">
            <Form.Item label="Выберите способ вывода" required>
              <Select 
                value={withdrawMethod}
                onChange={setWithdrawMethod}
                style={{ width: '100%' }}
              >
                <Option value="card">Банковская карта</Option>
                <Option value="bank">Банковский счёт</Option>
                <Option value="qiwi">QIWI Кошелек</Option>
                <Option value="yoomoney">ЮMoney</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Сумма вывода" required>
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
                    key={preset.toString()} 
                    onClick={() => preset === 'all' ? setMaxAmount() : setAmount(preset.toString())}
                    type={amount === (preset === 'all' ? currentBalance.toString() : preset.toString()) ? 'primary' : 'default'}
                    style={{ margin: '8px 4px 0 0' }}
                  >
                    {preset === 'all' ? 'Весь баланс' : `${preset} ₽`}
                  </Button>
                ))}
              </div>
            </Form.Item>
            
            <Form.Item 
              label={`Реквизиты для вывода (${withdrawMethod === 'card' ? 'номер карты' : 
                     withdrawMethod === 'bank' ? 'банковские реквизиты' : 
                     withdrawMethod === 'qiwi' ? 'номер телефона' : 
                     'номер кошелька'})`} 
              required
            >
              <TextArea 
                rows={3} 
                value={withdrawDetails}
                onChange={(e) => setWithdrawDetails(e.target.value)}
                placeholder={withdrawMethod === 'card' ? 'Номер карты (16 цифр)' : 
                            withdrawMethod === 'bank' ? 'ФИО получателя, БИК банка, номер счета' : 
                            withdrawMethod === 'qiwi' ? 'Номер телефона (с кодом страны)' : 
                            'Номер кошелька ЮMoney'}
              />
            </Form.Item>

            <Divider />
            
            <Alert
              message="Текущий баланс: 0,00 ₽"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div className="withdraw-summary">
              <div className="summary-row">
                <Text>Сумма к выводу:</Text>
                <Text strong>{amount || 0} ₽</Text>
              </div>
              <div className="summary-row">
                <Text>Комиссия ({commissionRate}%):</Text>
                <Text type="secondary">{calculateCommission()} ₽</Text>
              </div>
              <div className="summary-row">
                <Text strong>Итого к получению:</Text>
                <Text strong style={{ fontSize: '16px', color: '#1677ff' }}>{calculateFinalAmount()} ₽</Text>
              </div>
            </div>
            
            <Form.Item style={{ marginTop: 20, textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<BankOutlined />}
                onClick={handleWithdraw}
                loading={isLoading}
                disabled={!amount || parseFloat(amount) <= 0 || currentBalance <= 0}
                style={{ width: '80%' }}
              >
                Вывести средства
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      title: 'Подтверждение',
      content: (
        <div className="withdraw-success">
          <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', margin: '20px 0' }} />
          <Title level={3}>Заявка на вывод средств создана</Title>
          <Paragraph>
            Ваша заявка на вывод средств успешно создана и будет обработана в течение 24 часов.
          </Paragraph>
          <Alert 
            type="info" 
            message="Статус заявки вы можете отслеживать в разделе 'История операций'."
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
    <div className="withdraw-page">
      <Card 
        title={<Title level={3}>Вывод средств</Title>}
        className="withdraw-card"
        bordered={false}
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
        <div className="steps-content">{steps[currentStep].content}</div>
      </Card>
    </div>
  );
} 