import { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tabs,
  Table,
  Button,
  Spin,
  message,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Empty,
  Breadcrumb,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type {
  Company,
  Contact,
  ContactCreate,
  Deal,
  Task,
  Paginated,
} from '../types';

const { Title } = Typography;

const INDUSTRY_LABELS: Record<string, string> = {
  it: 'IT',
  retail: 'Розница',
  wholesale: 'Оптовая торговля',
  manufacturing: 'Производство',
  services: 'Услуги',
  construction: 'Строительство',
  logistics: 'Логистика',
  other: 'Другое',
};

const CLIENT_TYPE_LABELS: Record<string, string> = {
  distributor: 'Дистрибьютор',
  retail: 'Розница',
  government: 'Госсектор',
  corporate: 'Корпоративный',
};

const ROLE_LABELS: Record<string, string> = {
  decision_maker: 'ЛПР',
  influencer: 'Влияющий',
  technical: 'Технический',
  other: 'Другое',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  open: 'Открыта',
  done: 'Выполнена',
  cancelled: 'Отменена',
};

const TASK_TYPE_LABELS: Record<string, string> = {
  call: 'Звонок',
  meeting: 'Встреча',
  email: 'Письмо',
  offer: 'КП',
  other: 'Другое',
};

const STAGE_LABELS: Record<string, string> = {
  first_contact: 'Первичный контакт',
  needs: 'Потребности',
  offer: 'КП',
  negotiation: 'Переговоры',
  contract: 'Договор',
  payment: 'Оплата',
  won: 'Успех',
  lost: 'Отказ',
};

const formatMoney = (v: string | number) =>
  Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = Number(id);

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactForm] = Form.useForm<ContactCreate>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [companyRes, contactsRes, dealsRes, tasksRes] = await Promise.all([
        api.get<Company>(`/companies/${companyId}/`),
        api.get<Paginated<Contact>>('/contacts/', {
          params: { company: companyId, page_size: 500 },
        }),
        api.get<Paginated<Deal>>('/deals/', {
          params: { company: companyId, page_size: 500 },
        }),
        api.get<Paginated<Task>>('/tasks/', {
          params: { company: companyId, page_size: 500 },
        }),
      ]);
      setCompany(companyRes.data);
      setContacts(contactsRes.data.results);
      setDeals(dealsRes.data.results);
      setTasks(tasksRes.data.results);
    } catch {
      message.error('Не удалось загрузить данные компании');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [companyId]);

  const onCreateContact = async (values: ContactCreate) => {
    setSavingContact(true);
    try {
      await api.post('/contacts/', { ...values, company: companyId });
      message.success('Контакт добавлен');
      setContactModalOpen(false);
      contactForm.resetFields();
      loadAll();
    } catch {
      message.error('Не удалось добавить контакт');
    } finally {
      setSavingContact(false);
    }
  };

  const onEditCompany = async (values: any) => {
    setSavingEdit(true);
    try {
      await api.patch(`/companies/${companyId}/`, values);
      message.success('Компания обновлена');
      setEditModalOpen(false);
      loadAll();
    } catch {
      message.error('Не удалось сохранить изменения');
    } finally {
      setSavingEdit(false);
    }
  };

  const onDeleteCompany = async () => {
    try {
      await api.delete(`/companies/${companyId}/`);
      message.success('Компания удалена');
      navigate('/companies');
    } catch {
      message.error('Не удалось удалить компанию');
    }
  };

  const onDeleteContact = async (contactId: number) => {
    try {
      await api.delete(`/contacts/${contactId}/`);
      message.success('Контакт удалён');
      loadAll();
    } catch {
      message.error('Не удалось удалить контакт');
    }
  };

  const openEditModal = () => {
    if (!company) return;
    editForm.setFieldsValue({
      name: company.name,
      inn: company.inn,
      kpp: company.kpp,
      ogrn: company.ogrn,
      legal_address: company.legal_address,
      actual_address: company.actual_address,
      industry: company.industry,
      client_type: company.client_type,
      region: company.region,
      source: company.source,
      notes: company.notes,
    });
    setEditModalOpen(true);
  };

  if (loading) return <Spin style={{ marginTop: 100 }} />;
  if (!company) return <Empty description="Компания не найдена" />;

  const contactColumns = [
    { title: 'ФИО', dataIndex: 'full_name' },
    { title: 'Должность', dataIndex: 'position' },
    { title: 'Телефон', dataIndex: 'phone_mobile', width: 160 },
    { title: 'Email', dataIndex: 'email', width: 200 },
    {
      title: 'Роль',
      dataIndex: 'role_in_deal',
      width: 140,
      render: (v: string) => (v ? <Tag>{ROLE_LABELS[v] ?? v}</Tag> : '—'),
    },
    {
      title: '',
      width: 60,
      render: (_: any, record: Contact) => (
        <Popconfirm
          title="Удалить контакт?"
          onConfirm={() => onDeleteContact(record.id)}
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const dealColumns = [
    { title: 'Название', dataIndex: 'title' },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      width: 160,
      render: (v: string, r: Deal) => `${formatMoney(v)} ${r.currency}`,
    },
    {
      title: 'Этап',
      dataIndex: 'stage',
      width: 180,
      render: (v: string) => <Tag>{STAGE_LABELS[v] ?? v}</Tag>,
    },
    {
      title: 'Вероятность',
      dataIndex: 'probability',
      width: 120,
      render: (v: number) => `${v}%`,
    },
  ];

  const taskColumns = [
    { title: 'Название', dataIndex: 'title' },
    {
      title: 'Тип',
      dataIndex: 'type',
      width: 120,
      render: (v: string) => TASK_TYPE_LABELS[v] ?? v,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => <Tag>{TASK_STATUS_LABELS[v] ?? v}</Tag>,
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      width: 160,
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString('ru-RU') : '—',
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Breadcrumb
        items={[
          { title: <Link to="/companies">Клиенты</Link> },
          { title: company.name },
        ]}
      />

      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/companies')}>
          Назад
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          {company.name}
        </Title>
        <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>
          Редактировать
        </Button>
        <Popconfirm
          title="Удалить компанию?"
          description="Все связанные сделки, контакты и задачи будут удалены."
          onConfirm={onDeleteCompany}
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />}>
            Удалить
          </Button>
        </Popconfirm>
      </Space>

      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: 'info',
            label: 'Информация',
            children: (
              <Card>
                <Descriptions column={2} bordered size="middle">
                  <Descriptions.Item label="Наименование" span={2}>
                    {company.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="ИНН">
                    {company.inn || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="КПП">
                    {company.kpp || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="ОГРН">
                    {company.ogrn || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Отрасль">
                    {INDUSTRY_LABELS[company.industry] || company.industry || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Тип клиента">
                    {CLIENT_TYPE_LABELS[company.client_type] ||
                      company.client_type ||
                      '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Регион">
                    {company.region || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Источник">
                    {company.source || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Юр. адрес" span={2}>
                    {company.legal_address || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Факт. адрес" span={2}>
                    {company.actual_address || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Заметки" span={2}>
                    {company.notes || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Создано">
                    {new Date(company.created_at).toLocaleDateString('ru-RU')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Обновлено">
                    {new Date(company.updated_at).toLocaleDateString('ru-RU')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: 'contacts',
            label: `Контакты (${contacts.length})`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setContactModalOpen(true)}
                >
                  Добавить контакт
                </Button>
                <Table
                  rowKey="id"
                  columns={contactColumns}
                  dataSource={contacts}
                  pagination={false}
                />
              </Space>
            ),
          },
          {
            key: 'deals',
            label: `Сделки (${deals.length})`,
            children: (
              <Table
                rowKey="id"
                columns={dealColumns}
                dataSource={deals}
                pagination={false}
              />
            ),
          },
          {
            key: 'tasks',
            label: `Задачи (${tasks.length})`,
            children: (
              <Table
                rowKey="id"
                columns={taskColumns}
                dataSource={tasks}
                pagination={false}
              />
            ),
          },
        ]}
      />

      <Modal
        title="Новый контакт"
        open={contactModalOpen}
        onCancel={() => setContactModalOpen(false)}
        onOk={() => contactForm.submit()}
        confirmLoading={savingContact}
        okText="Добавить"
        cancelText="Отмена"
        width={600}
      >
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={onCreateContact}
          autoComplete="off"
        >
          <Form.Item
            name="full_name"
            label="ФИО"
            rules={[{ required: true, message: 'Введите ФИО' }]}
          >
            <Input placeholder="Иванов Иван Иванович" />
          </Form.Item>

          <Form.Item name="position" label="Должность">
            <Input placeholder="Генеральный директор" />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item
              name="phone_mobile"
              label="Мобильный"
              style={{ minWidth: 220 }}
            >
              <Input placeholder="+7 999 123-45-67" />
            </Form.Item>
            <Form.Item
              name="phone_work"
              label="Рабочий"
              style={{ minWidth: 220 }}
            >
              <Input placeholder="+7 495 123-45-67" />
            </Form.Item>
          </Space>

          <Form.Item name="email" label="Email">
            <Input placeholder="ivanov@company.ru" />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item
              name="telegram"
              label="Telegram"
              style={{ minWidth: 220 }}
            >
              <Input placeholder="@username" />
            </Form.Item>
            <Form.Item
              name="whatsapp"
              label="WhatsApp"
              style={{ minWidth: 220 }}
            >
              <Input placeholder="+7 999 123-45-67" />
            </Form.Item>
          </Space>

          <Form.Item name="role_in_deal" label="Роль в сделке">
            <Select
              allowClear
              placeholder="Выберите роль"
              options={[
                { value: 'decision_maker', label: 'ЛПР' },
                { value: 'influencer', label: 'Влияющий' },
                { value: 'technical', label: 'Технический специалист' },
                { value: 'other', label: 'Другое' },
              ]}
            />
          </Form.Item>

          <Form.Item name="notes" label="Заметки">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактирование компании"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={savingEdit}
        okText="Сохранить"
        cancelText="Отмена"
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={onEditCompany}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Наименование"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="inn" label="ИНН" style={{ minWidth: 200 }}>
              <Input maxLength={12} />
            </Form.Item>
            <Form.Item name="kpp" label="КПП" style={{ minWidth: 160 }}>
              <Input maxLength={9} />
            </Form.Item>
            <Form.Item name="ogrn" label="ОГРН" style={{ minWidth: 200 }}>
              <Input maxLength={15} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="industry" label="Отрасль" style={{ minWidth: 220 }}>
              <Select
                allowClear
                options={[
                  { value: 'it', label: 'IT' },
                  { value: 'retail', label: 'Розница' },
                  { value: 'wholesale', label: 'Оптовая торговля' },
                  { value: 'manufacturing', label: 'Производство' },
                  { value: 'services', label: 'Услуги' },
                  { value: 'construction', label: 'Строительство' },
                  { value: 'logistics', label: 'Логистика' },
                  { value: 'other', label: 'Другое' },
                ]}
              />
            </Form.Item>
            <Form.Item name="client_type" label="Тип" style={{ minWidth: 200 }}>
              <Select
                allowClear
                options={[
                  { value: 'distributor', label: 'Дистрибьютор' },
                  { value: 'retail', label: 'Розница' },
                  { value: 'government', label: 'Госсектор' },
                  { value: 'corporate', label: 'Корпоративный' },
                ]}
              />
            </Form.Item>
          </Space>

          <Form.Item name="region" label="Регион">
            <Input />
          </Form.Item>

          <Form.Item name="legal_address" label="Юридический адрес">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="actual_address" label="Фактический адрес">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="source" label="Источник">
            <Input />
          </Form.Item>

          <Form.Item name="notes" label="Заметки">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}