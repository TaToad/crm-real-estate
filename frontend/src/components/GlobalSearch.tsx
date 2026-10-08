import { useState, useRef, useEffect } from 'react';
import { Input, List, Tag, Empty, Spin, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const { Text } = Typography;

interface SearchResult {
  type: 'company' | 'deal' | 'contact' | 'lead';
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  company: { label: 'Клиент', color: 'blue' },
  deal: { label: 'Сделка', color: 'green' },
  contact: { label: 'Контакт', color: 'orange' },
  lead: { label: 'Лид', color: 'purple' },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ results: SearchResult[] }>('/search/', {
          params: { q: query },
        });
        setResults(res.data.results);
        setOpen(true);
      } catch {
        // молча
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(item.url);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 400 }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Поиск: клиент, сделка, контакт, лид..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        allowClear
        size="large"
      />

      {open && (query.length >= 2) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 6,
            zIndex: 1000,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : results.length === 0 ? (
            <Empty
              description="Ничего не найдено"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: 20 }}
            />
          ) : (
            <List
              size="small"
              dataSource={results}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '8px 12px' }}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#f5f5f5')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <List.Item.Meta
                    title={
                      <span>
                        <Tag color={TYPE_LABELS[item.type].color}>
                          {TYPE_LABELS[item.type].label}
                        </Tag>
                        {item.title}
                      </span>
                    }
                    description={
                      item.subtitle ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.subtitle}
                        </Text>
                      ) : null
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}