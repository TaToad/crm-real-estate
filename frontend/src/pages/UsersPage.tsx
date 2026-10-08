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
  Switch,
  Popconfirm,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import type { User, Paginated } from '../types';
import { useAuth } from '../auth/AuthContext';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Администратор' },
  { value: 'head', label: 'Руководитель' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'marketer', label: 'Маркетолог' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  head: 'purple',
  manager: 'blue',
  marketer: 'cyan',
};

const roleLabel = (v: string) =>
  ROLE_OPTIONS.find((o) => o.value === v)?.label ?? v;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async (searchValue: string = '') => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<User>>('/users/', {
        params: { search: searchValue || undefined, page_size: 100 },
      });
      setData(res.data.results);
      setTotal(res.data.count);
    } catch {
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'manager',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department,
      is_active: user.is_active,
      password: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload: any = {
        username: values.username,
        email: values.email || '',
        first_name: values.first_name || '',
        last_name: values.last_name || '',
        role: values.role,
        department: values.department || '',
        is_active: values.is_active,
      };

      if (editing) {
        if (values.password) payload.password = values.password;
        await api.patch(`/users/${editing.id}/`, payload);
        message.success('Пользователь обновлён');
      } else {
        payload.password = values.password;
        await api.post('/users/', payload);
        message.success('Пользователь создан');
      }

      setModalOpen(false);
      form.resetFields();
      load(search);
    } catch (e: any) {
      const detail =
        e?.response?.data?.username?.[0] ||
        e?.response?.data?.password?.[0] ||
        e?.response?.data?.detail ||
        'Не удалось сохранить пользователя';
      message.error(detail);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}/`);
      message.success('Пользователь удалён');
      load(search);
    } catch (e: any) {
      message.error(e?.response?.data?.detail || 'Не удалось удалить');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Логин', dataIndex: 'username', width: 150 },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Имя',
      width: 200,
      render: (_: any, r: User) =>
        `${r.first_name} ${r.last_name}`.trim() || '—',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      width: 160,
      render: (v: string) => <Tag color={ROLE_COLORS[v]}>{roleLabel(v)}</Tag>,
    },
    { title: 'Отдел', dataIndex: 'department', width: 160 },
    {
      title: 'Активен',
      dataIndex: 'is_active',
      width: 100,
      render: (v: boolean) =>
        v ? <Tag color="green">Да</Tag> : <Tag color="red">Нет</Tag>,
    },
    {
      title: '',
      width: 120,
      render: (_: any, record: User) => (
        <Space>
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Удалить пользователя?"
            onConfirm={() => onDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            disabled={record.id === currentUser?.id}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.id === currentUser?.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isAdmin =
    currentUser?.role === 'admin' || (currentUser as any)?.is_superuser;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {!isAdmin && (
        <Alert
          type="warning"
          showIcon
          message="Только администраторы могут управлять пользователями"
        />
      )}

      <Space>
        <Input.Search
          placeholder="Поиск по логину, email, имени"
          allowClear
          style={{ width: 320 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) => load(v)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          disabled={!isAdmin}
        >
          Новый пользователь
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
        title={editing ? 'Редактирование пользователя' : 'Новый пользователь'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit} autoComplete="off">
          <Form.Item
            name="username"
            label="Логин"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input placeholder="ivanov" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="ivanov@company.ru" />
          </Form.Item>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item name="first_name" label="Имя" style={{ minWidth: 200 }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Фамилия" style={{ minWidth: 200 }}>
              <Input />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item
              name="role"
              label="Роль"
              style={{ minWidth: 220 }}
              rules={[{ required: true, message: 'Выберите роль' }]}
            >
              <Select options={ROLE_OPTIONS} />
            </Form.Item>
            <Form.Item name="department" label="Отдел" style={{ minWidth: 220 }}>
              <Input placeholder="Отдел продаж" />
            </Form.Item>
          </Space>

          <Form.Item
            name="password"
            label={editing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
            rules={
              editing
                ? []
                : [
                    { required: true, message: 'Введите пароль' },
                    { min: 6, message: 'Минимум 6 символов' },
                  ]
            }
          >
            <Input.Password placeholder="Минимум 6 символов" />
          </Form.Item>

          <Form.Item name="is_active" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}