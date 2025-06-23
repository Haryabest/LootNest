'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Divider, Typography, Space } from 'antd';
import { getRouteMetrics, clearRouteMetrics, optimizePerformance } from '@/lib/performance';
import { debugAuth } from '@/lib/supabase';

const { Text, Title } = Typography;

export default function PerformanceDebugger() {
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>({});
  const [authInfo, setAuthInfo] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      updateMetrics();
    }
  }, [visible]);

  const updateMetrics = () => {
    const currentMetrics = getRouteMetrics();
    setMetrics(currentMetrics);
    
    // Получаем информацию об аутентификации
    if (typeof window !== 'undefined') {
      const authDebugInfo = debugAuth();
      setAuthInfo(authDebugInfo);
    }
  };

  const handleOptimize = () => {
    optimizePerformance();
    setTimeout(() => {
      updateMetrics();
    }, 100);
  };

  if (!visible) {
    return (
      <div
        style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.2)', 
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000
        }}
        onClick={() => setVisible(true)}
      >
        <span style={{ color: 'white', fontSize: '20px' }}>📊</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '440px',
        maxWidth: '100%',
        height: '100%',
        background: 'white',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '15px',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={4} style={{ margin: 0 }}>Performance Debugger</Title>
        <Space>
          <Button size="small" onClick={updateMetrics}>Refresh</Button>
          <Button size="small" danger onClick={() => setVisible(false)}>Close</Button>
        </Space>
      </div>

      <Divider style={{ margin: '10px 0' }} />
      
      <Title level={5}>Route Navigation Times</Title>
      <div>
        <Text>Average Time: </Text>
        <Text strong style={{ color: metrics.averageTime > 3000 ? '#ff4d4f' : '#52c41a' }}>
          {' '}{metrics.averageTime?.toFixed(2) || 0}ms
        </Text>
      </div>
      <div style={{ marginTop: '5px' }}>
        <Text>Slowest Route: </Text>
        <Text strong style={{ color: '#ff4d4f' }}>
          {metrics.slowestRoute?.route || 'none'}: {metrics.slowestRoute?.time?.toFixed(2) || 0}ms
        </Text>
      </div>

      <Divider style={{ margin: '15px 0 10px 0' }} />
      
      <Title level={5}>Recent Routes</Title>
      {metrics.recentRoutes?.map((item: any, index: number) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <Text style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.route || '/'}:
          </Text>
          <Text style={{ 
            color: item.time > 3000 ? '#ff4d4f' : 
                  item.time > 1000 ? '#faad14' : '#52c41a' 
          }}>
            {' '}{item.time.toFixed(2)}ms
          </Text>
        </div>
      ))}

      <Divider style={{ margin: '15px 0 10px 0' }} />
      
      <Title level={5}>System Diagnostics</Title>
      <div>
        <Text>Browser: </Text>
        <Text code>{metrics.systemInfo?.browser || 'Unknown'}</Text>
      </div>
      <div>
        <Text>Connection: </Text>
        <Text code>{metrics.systemInfo?.connection || 'Unknown'}</Text>
      </div>
      <div>
        <Text>Memory Usage: </Text>
        <Text code>{metrics.systemInfo?.memoryUsage || 'Unknown'}</Text>
      </div>
      <div>
        <Text>localStorage: </Text>
        <Text code>{metrics.systemInfo?.localStorage || 'Unknown'}</Text>
      </div>
      
      {authInfo && (
        <>
          <Divider style={{ margin: '15px 0 10px 0' }} />
          <Title level={5}>Auth Status</Title>
          <div>
            <Text>Storage Available: </Text>
            <div style={{ marginLeft: '15px' }}>
              <Text>localStorage: </Text>
              <Text code>{authInfo?.storageAvailable?.localStorage ? 'Yes' : 'No'}</Text>
              <br />
              <Text>sessionStorage: </Text>
              <Text code>{authInfo?.storageAvailable?.sessionStorage ? 'Yes' : 'No'}</Text>
              <br />
              <Text>cookies: </Text>
              <Text code>{authInfo?.storageAvailable?.cookies ? 'Yes' : 'No'}</Text>
            </div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <Text>Auth Tokens: </Text>
            <div style={{ marginLeft: '15px' }}>
              <Text>Session token: </Text>
              <Text code>{authInfo?.tokens?.hasSessionToken ? 'Present' : 'Missing'}</Text>
              <br />
              <Text>Backup token: </Text>
              <Text code>{authInfo?.tokens?.hasBackupToken ? 'Present' : 'Missing'}</Text>
              <br />
              <Text>Cookie token: </Text>
              <Text code>{authInfo?.tokens?.hasCookieToken ? 'Present' : 'Missing'}</Text>
            </div>
          </div>
        </>
      )}

      <Divider style={{ margin: '15px 0 10px 0' }} />
      
      <Space>
        <Button onClick={handleOptimize} type="primary">
          Optimize Performance
        </Button>
        <Button onClick={() => clearRouteMetrics()} danger>
          Clear Metrics
        </Button>
      </Space>
    </div>
  );
} 