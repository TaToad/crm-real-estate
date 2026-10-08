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
  DatePicker,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/client';
import type { Task, Company, Deal, Paginated } from '../types';

const TYPE_OPTIONS = [
  { value: 'call', label: 'Звонок' },
  { value: 'meeting', label: 'Встреча' },
  { value: 'email', label: 'Письмо' },
  { value: 'offer', label: 'Подготовка КП' },
  { value: 'other', label: 'Другое' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Открыта' },
  { value: 'done', label: 'Выполнена' },
  { value: 'cancelled', label: 'Отменена' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'red',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'orange',
  done: 'green',
  cancelled: 'default',
};

const labelFrom = (options: { value: string; label: string }[], v: string) =>
  options.find((o) => o.value === v)?.label ?? v;

export default function TasksPage() {
  const [data, setData] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    type?: string;
  }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Task>>('/tasks/', {
        params: { ...filters, page_size: 100 },
      });
      setData(res.data.results);
      setTotal(res.data.count);
    } catch {
      message.error('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const [c, d] = await Promise.all([
        api.get<Paginated<Company>>('/companies/', { params: { page_size: 500 } }),
        api.get<Paginated<Deal>>('/deals/', { params: { page_size: 500 } }),
      ]);
      setCompanies(c.data.results);
      setDeals(d.data.results);
    } catch {
      // молча
    }
  };

  useEffect(() => {
    void load();
  }, [filters]);

  useEffect(() => {
    void loadRefs();
  }, []);

  const onCreate = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        type: values.type,
        priority: values.priority,
        status: 'open',
        deadline: values.deadline ? values.deadline.toISOString() : null,
        company: values.company || null,
        deal: values.deal || null,
        description: values.description || '',
      };
      await api.post('/tasks/', payload);
      message.success('Задача создана');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch {
      message.error('Не удалось создать задачу');
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'open' : 'done';
    try {
      await api.patch(`/tasks/${task.id}/`, { status: newStatus });
      message.success(newStatus === 'done' ? 'Задача выполнена' : 'Задача возвращена');
      load();
    } catch {
      message.error('Не удалось обновить задачу');
    }
  };

  const columns = [
    {
      title: 'Готово',
      width: 70,
      render: (_: any, r: Task) => (
        <input
          type="checkbox"
          checked={r.status === 'done'}
          onChange={() => toggleDone(r)}
        />
      ),
    },
    { title: 'Название', dataIndex: 'title' },
    {
      title: 'Тип',
      dataIndex: 'type',
      width: 140,
      render: (v: string) => labelFrom(TYPE_OPTIONS, v),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      width: 120,
      render: (v: string) => (
        <Tag color={PRIORITY_COLORS[v]}>{labelFrom(PRIORITY_OPTIONS, v)}</Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 130,
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v]}>{labelFrom(STATUS_OPTIONS, v)}</Tag>
      ),
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      width: 160,
      render: (v: string | null) =>
        v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
    },
    {
      title: 'Сделка',
      dataIndex: 'deal_title',
      width: 200,
      render: (v: string | undefined) => v || '—',
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Select
          allowClear
          placeholder="Статус"
          style={{ width: 160 }}
          options={STATUS_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        />
        <Select
          allowClear
          placeholder="Приоритет"
          style={{ width: 160 }}
          options={PRIORITY_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
        />
        <Select
          allowClear
          placeholder="Тип"
          style={{ width: 180 }}
          options={TYPE_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Новая задача
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
        title="Новая задача"
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
          initialValues={{ type: 'call', priority: 'medium' }}
        >
          <Form.Item
            name="title"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Позвонить клиенту" />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="type" label="Тип" style={{ minWidth: 180 }}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="priority" label="Приоритет" style={{ minWidth: 160 }}>
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
          </Space>

          <Form.Item name="deadline" label="Дедлайн">
            <DatePicker
              showTime
              format="DD.MM.YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="deal" label="Сделка">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Выберите сделку"
              options={deals.map((d) => ({ value: d.id, label: d.title }))}
            />
          </Form.Item>

          <Form.Item name="company" label="Компания">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Выберите компанию"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}