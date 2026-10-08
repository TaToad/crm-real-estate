import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
} from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Lead, LeadCreate, Paginated } from '../types';

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Форма на сайте' },
  { value: 'email', label: 'Email' },
  { value: 'manual', label: 'Ручной ввод' },
  { value: 'api', label: 'API' },
  { value: 'referral', label: 'Рекомендация' },
  { value: 'other', label: 'Другое' },
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'qualified', label: 'Квалифицирован' },
  { value: 'rejected', label: 'Отклонён' },
  { value: 'converted', label: 'Конвертирован' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'blue',
  in_progress: 'orange',
  qualified: 'cyan',
  rejected: 'red',
  converted: 'green',
};

const labelFrom = (options: { value: string; label: string }[], v: string) =>
  options.find((o) => o.value === v)?.label ?? v;

export default function LeadsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ status?: string; source?: string }>({});

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<LeadCreate>();

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm] = Form.useForm();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Lead>>('/leads/', {
        params: { ...filters, page_size: 100 },
      });
      setData(res.data.results);
      setTotal(res.data.count);
    } catch {
      message.error('Не удалось загрузить лиды');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  const onCreate = async (values: LeadCreate) => {
    setSaving(true);
    try {
      await api.post('/leads/', values);
      message.success('Лид создан');
      setCreateModalOpen(false);
      form.resetFields();
      load();
    } catch {
      message.error('Не удалось создать лид');
    } finally {
      setSaving(false);
    }
  };

  const openConvertModal = (lead: Lead) => {
    setSelectedLead(lead);
    convertForm.setFieldsValue({
      title: `Сделка по лиду: ${lead.title}`,
      amount: 0,
      currency: 'RUB',
    });
    setConvertModalOpen(true);
  };

  const onConvert = async (values: any) => {
    if (!selectedLead) return;
    setConverting(true);
    try {
      const res = await api.post(`/leads/${selectedLead.id}/convert/`, {
        title: values.title,
        amount: String(values.amount ?? 0),
        currency: values.currency,
      });
      message.success('Лид конвертирован в сделку');
      setConvertModalOpen(false);
      convertForm.resetFields();
      load();
      // Переходим на карточку компании, к которой привязана сделка
      const companyId = res.data.company_id;
      if (companyId) navigate(`/companies/${companyId}`);
    } catch (e: any) {
      const detail = e?.response?.data?.detail || 'Не удалось конвертировать';
      message.error(detail);
    } finally {
      setConverting(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.delete(`/leads/${id}/`);
      message.success('Лид удалён');
      load();
    } catch {
      message.error('Не удалось удалить лид');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Название', dataIndex: 'title' },
    { title: 'Компания', dataIndex: 'company_name', width: 200 },
    {
      title: 'Источник',
      dataIndex: 'source',
      width: 160,
      render: (v: string) => labelFrom(SOURCE_OPTIONS, v),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 150,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v]}>{labelFrom(STATUS_OPTIONS, v)}</Tag>
      ),
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      width: 130,
      render: (v: string) => new Date(v).toLocaleDateString('ru-RU'),
    },
    {
      title: '',
      width: 220,
      render: (_: any, record: Lead) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<ThunderboltOutlined />}
            disabled={record.status === 'converted'}
            onClick={() => openConvertModal(record)}
          >
            В сделку
          </Button>
          <Popconfirm
            title="Удалить лид?"
            onConfirm={() => onDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Select
          allowClear
          placeholder="Статус"
          style={{ width: 180 }}
          options={STATUS_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        />
        <Select
          allowClear
          placeholder="Источник"
          style={{ width: 180 }}
          options={SOURCE_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
        >
          Новый лид
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ total, pageSize: 20 }}
      />

      <Modal
        title="Новый лид"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
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
          initialValues={{ source: 'manual', status: 'new' }}
        >
          <Form.Item
            name="title"
            label="Название лида"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Заявка с сайта на поставку" />
          </Form.Item>

          <Form.Item name="company_name" label="Компания (название)">
            <Input placeholder="ООО Ромашка" />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="source" label="Источник" style={{ minWidth: 220 }}>
              <Select options={SOURCE_OPTIONS} />
            </Form.Item>
            <Form.Item name="status" label="Статус" style={{ minWidth: 200 }}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Space>

          <Form.Item name="notes" label="Заметки">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Конвертировать лид: ${selectedLead?.title ?? ''}`}
        open={convertModalOpen}
        onCancel={() => setConvertModalOpen(false)}
        onOk={() => convertForm.submit()}
        confirmLoading={converting}
        okText="Создать сделку"
        cancelText="Отмена"
        width={500}
      >
        <Form form={convertForm} layout="vertical" onFinish={onConvert}>
          <Form.Item
            name="title"
            label="Название сделки"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="amount" label="Сумма" style={{ minWidth: 200 }}>
              <InputNumber min={0} step={1000} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="currency" label="Валюта" style={{ minWidth: 140 }}>
              <Select
                options={[
                  { value: 'RUB', label: '₽ Рубль' },
                  { value: 'USD', label: '$ Доллар' },
                  { value: 'EUR', label: '€ Евро' },
                ]}
              />
            </Form.Item>
          </Space>

          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            Сделка будет создана на этапе «Первичный контакт». Компания будет
            создана автоматически, если её ещё нет.
          </div>
        </Form>
      </Modal>
    </Space>
  );
}