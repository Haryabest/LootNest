'use client'

import React from 'react';
import { Switch, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

const { Text } = Typography;

export default function ApiModeToggle() {
  const { useDirectSupabase, setUseDirectSupabase } = useAuth();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Text type="secondary">Режим API:</Text>
      <Switch
        checked={!useDirectSupabase}
        onChange={(checked) => setUseDirectSupabase(!checked)}
        checkedChildren="Бэкенд"
        unCheckedChildren="Прямой"
        size="small"
      />
      <Text type="secondary" style={{ fontSize: '12px' }}>
        {useDirectSupabase ? 'Прямой доступ к Supabase' : 'Через бэкенд API'}
      </Text>
    </div>
  );
} 