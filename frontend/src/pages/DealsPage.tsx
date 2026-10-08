import { useEffect, useState } from 'react';
import {
  Card,
  Spin,
  message,
  Tag,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/client';
import type { Deal, DealCreate, Company, Paginated } from '../types';

const { Text } = Typography;

const STAGES = [
  { key: 'first_contact', label: 'Первичный контакт', color: '#d9d9d9' },
  { key: 'needs', label: 'Выявление потребностей', color: '#bae0ff' },
  { key: 'offer', label: 'КП', color: '#91caff' },
  { key: 'negotiation', label: 'Переговоры', color: '#69b1ff' },
  { key: 'contract', label: 'Договор', color: '#ffd591' },
  { key: 'payment', label: 'Оплата', color: '#ffc069' },
  { key: 'won', label: 'Успех', color: '#b7eb8f' },
  { key: 'lost', label: 'Отказ', color: '#ffa39e' },
];

const CURRENCY_OPTIONS = [
  { value: 'RUB', label: '₽ Рубль' },
  { value: 'USD', label: '$ Доллар' },
  { value: 'EUR', label: '€ Евро' },
];

const formatMoney = (v: string | number) =>
  Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadDeals = async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Deal>>('/deals/', {
        params: { page_size: 500 },
      });
      setDeals(res.data.results);
    } catch {
      message.error('Не удалось загрузить сделки');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.get<Paginated<Company>>('/companies/', {
        params: { page_size: 500 },
      });
      setCompanies(res.data.results);
    } catch {
      // молча
    }
  };

  useEffect(() => {
    void loadDeals();
    void loadCompanies();
  }, []);

  const moveStage = async (deal: Deal, direction: 'forward' | 'back') => {
    const idx = STAGES.findIndex((s) => s.key === deal.stage);
    if (idx === -1) return;
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;

    const newStage = STAGES[newIdx].key;
    const prev = deals;
    setDeals(deals.map((d) => (d.id === deal.id ? { ...d, stage: newStage } : d)));

    try {
      await api.patch(`/deals/${deal.id}/stage/`, { stage: newStage });
    } catch {
      message.error('Не удалось сменить этап');
      setDeals(prev);
    }
  };

  const onCreate = async (values: any) => {
    setSaving(true);
    try {
      const payload: DealCreate = {
        title: values.title,
        company: values.company,
        amount: values.amount ? String(values.amount) : '0',
        currency: values.currency || 'RUB',
        stage: values.stage || 'first_contact',
        probability: values.probability ?? 10,
        description: values.description || '',
      };
      if (values.close_date) {
        payload.close_date = values.close_date.format('YYYY-MM-DD');
      }
      await api.post('/deals/', payload);
      message.success('Сделка создана');
      setModalOpen(false);
      form.resetFields();
      loadDeals();
    } catch {
      message.error('Не удалось создать сделку');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin style={{ marginTop: 100 }} />;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Новая сделка
        </Button>
      </Space>

      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 16,
          alignItems: 'flex-start',
        }}
      >
        {STAGES.map((stage, stageIndex) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const total = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0);

          return (
            <div
              key={stage.key}
              style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}
            >
              <div
                style={{
                  background: stage.color,
                  padding: '8px 12px',
                  borderRadius: '6px 6px 0 0',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{stage.label}</span>
                <Tag style={{ marginRight: 0 }}>{stageDeals.length}</Tag>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#595959',
                  padding: '4px 12px 8px',
                  background: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {formatMoney(total)} ₽
              </div>

              <div
                style={{
                  minHeight: 200,
                  background: '#fafafa',
                  padding: 8,
                  borderRadius: '0 0 6px 6px',
                }}
              >
                {stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    size="small"
                    style={{
                      marginBottom: 8,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}
                    styles={{
                      body: { padding: 12 },
                    }}
                  >
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong ellipsis>
                        {deal.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {deal.company_name}
                      </Text>
                      <Text style={{ fontSize: 13 }}>
                        {formatMoney(deal.amount)} {deal.currency}
                      </Text>
                      <Space size={4} style={{ marginTop: 4 }}>
                        <Button
                          size="small"
                          icon={<ArrowLeftOutlined />}
                          disabled={stageIndex === 0}
                          onClick={() => moveStage(deal, 'back')}
                        />
                        <Button
                          size="small"
                          icon={<ArrowRightOutlined />}
                          disabled={stageIndex === STAGES.length - 1}
                          onClick={() => moveStage(deal, 'forward')}
                        />
                      </Space>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        title="Новая сделка"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Создать"
        cancelText="Отмена"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onCreate}
          autoComplete="off"
          initialValues={{
            currency: 'RUB',
            stage: 'first_contact',
            probability: 10,
          }}
        >
          <Form.Item
            name="title"
            label="Название сделки"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Поставка оборудования" />
          </Form.Item>

          <Form.Item
            name="company"
            label="Компания"
            rules={[{ required: true, message: 'Выберите компанию' }]}
          >
            <Select
              showSearch
              placeholder="Выберите компанию"
              optionFilterProp="label"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="amount" label="Сумма" style={{ minWidth: 200 }}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={1000}
                placeholder="0"
              />
            </Form.Item>
            <Form.Item name="currency" label="Валюта" style={{ minWidth: 140 }}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="stage" label="Этап" style={{ minWidth: 240 }}>
              <Select
                options={STAGES.map((s) => ({ value: s.key, label: s.label }))}
              />
            </Form.Item>
            <Form.Item
              name="probability"
              label="Вероятность, %"
              style={{ minWidth: 140 }}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="close_date" label="Прогноз закрытия">
            <DatePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              disabledDate={(d) => d && d < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}