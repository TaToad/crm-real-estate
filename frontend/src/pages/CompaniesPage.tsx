import { useEffect, useState } from 'react';
import {
  Table,
  Input,
  Space,
  Button,
  message,
  Tag,
  Modal,
  Form,
  Select,
  Upload,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Company, CompanyCreate, Paginated } from '../types';

const INDUSTRY_OPTIONS = [
  { value: 'it', label: 'IT' },
  { value: 'retail', label: 'Розница' },
  { value: 'wholesale', label: 'Оптовая торговля' },
  { value: 'manufacturing', label: 'Производство' },
  { value: 'services', label: 'Услуги' },
  { value: 'construction', label: 'Строительство' },
  { value: 'logistics', label: 'Логистика' },
  { value: 'other', label: 'Другое' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'distributor', label: 'Дистрибьютор' },
  { value: 'retail', label: 'Розница' },
  { value: 'government', label: 'Госсектор' },
  { value: 'corporate', label: 'Корпоративный' },
];

const industryLabel = (v?: string) =>
  INDUSTRY_OPTIONS.find((o) => o.value === v)?.label ?? v ?? '—';

const clientTypeLabel = (v?: string) =>
  CLIENT_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v ?? '—';

const API_URL = 'http://127.0.0.1:8000/api/v1';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CompanyCreate>();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const load = async (searchValue: string = '') => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Company>>('/companies/', {
        params: { search: searchValue || undefined },
      });
      setData(res.data.results);
      setTotal(res.data.count);
    } catch {
      message.error('Не удалось загрузить список клиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (values: CompanyCreate) => {
    setSaving(true);
    try {
      await api.post('/companies/', values);
      message.success('Компания создана');
      setModalOpen(false);
      form.resetFields();
      load(search);
    } catch {
      message.error('Не удалось создать компанию');
    } finally {
      setSaving(false);
    }
  };

  const onExport = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/companies/export/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'companies.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Файл скачан');
    } catch {
      message.error('Не удалось скачать файл');
    }
  };

  const onDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/companies/template/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'companies_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      message.error('Не удалось скачать шаблон');
    }
  };

  const onImport = async () => {
    if (!importFile) {
      message.warning('Выберите файл');
      return;
    }
    setImporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch(`${API_URL}/companies/import/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        message.error(result.detail || 'Ошибка импорта');
        return;
      }

      message.success(
        `Импорт завершён: создано ${result.created}, обновлено ${result.updated}` +
          (result.errors?.length ? `, ошибок: ${result.errors.length}` : ''),
      );
      setImportModalOpen(false);
      setImportFile(null);
      load(search);
    } catch {
      message.error('Не удалось импортировать файл');
    } finally {
      setImporting(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.delete(`/companies/${id}/`);
      message.success('Компания удалена');
      load(search);
    } catch {
      message.error('Не удалось удалить компанию');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Наименование', dataIndex: 'name' },
    { title: 'ИНН', dataIndex: 'inn', width: 130 },
    { title: 'Отрасль', dataIndex: 'industry', width: 160, render: industryLabel },
    { title: 'Регион', dataIndex: 'region', width: 140 },
    {
      title: 'Тип',
      dataIndex: 'client_type',
      width: 160,
      render: (t: string) => (t ? <Tag>{clientTypeLabel(t)}</Tag> : '—'),
    },
    {
      title: 'Создано',
      dataIndex: 'created_at',
      width: 130,
      render: (v: string) => new Date(v).toLocaleDateString('ru-RU'),
    },
    {
      title: '',
      width: 60,
      render: (_: any, record: Company) => (
        <Popconfirm
          title="Удалить компанию?"
          onConfirm={(e) => {
            e?.stopPropagation();
            onDelete(record.id);
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
        >
          <Button
            size="small"
            danger
            type="text"
            onClick={(e) => e.stopPropagation()}
          >
            ✕
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Input.Search
          placeholder="Поиск по названию, ИНН"
          allowClear
          style={{ width: 320 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) => load(v)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Добавить клиента
        </Button>
        <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
          Импорт CSV
        </Button>
        <Button icon={<DownloadOutlined />} onClick={onExport}>
          Экспорт CSV
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ total, pageSize: 20 }}
        onRow={(record) => ({
          onClick: () => navigate(`/companies/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Модалка создания */}
      <Modal
        title="Новая компания"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Создать"
        cancelText="Отмена"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onCreate} autoComplete="off">
          <Form.Item
            name="name"
            label="Наименование"
            rules={[{ required: true, message: 'Введите название компании' }]}
          >
            <Input placeholder="ООО Ромашка" />
          </Form.Item>

          <Form.Item name="inn" label="ИНН">
            <Input placeholder="10 или 12 цифр" maxLength={12} />
          </Form.Item>

          <Form.Item name="kpp" label="КПП">
            <Input placeholder="9 цифр" maxLength={9} />
          </Form.Item>

          <Form.Item name="industry" label="Отрасль">
            <Select
              allowClear
              placeholder="Выберите отрасль"
              options={INDUSTRY_OPTIONS}
            />
          </Form.Item>

          <Form.Item name="client_type" label="Тип клиента">
            <Select
              allowClear
              placeholder="Выберите тип"
              options={CLIENT_TYPE_OPTIONS}
            />
          </Form.Item>

          <Form.Item name="region" label="Регион">
            <Input placeholder="Москва" />
          </Form.Item>

          <Form.Item name="source" label="Источник">
            <Input placeholder="Сайт, рекомендация и т.д." />
          </Form.Item>

          <Form.Item name="notes" label="Заметки">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка импорта */}
      <Modal
        title="Импорт клиентов из CSV"
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          setImportFile(null);
        }}
        onOk={onImport}
        confirmLoading={importing}
        okText="Импортировать"
        cancelText="Отмена"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ color: '#595959' }}>
            Загрузите CSV-файл. Обязательная колонка: <b>name</b> (или «Наименование»).
            Если указан <b>inn</b>, существующие компании с таким ИНН будут обновлены,
            иначе созданы новые.
          </div>

          <Button icon={<FileTextOutlined />} onClick={onDownloadTemplate}>
            Скачать шаблон CSV
          </Button>

          <Upload
            accept=".csv"
            maxCount={1}
            beforeUpload={(file) => {
              setImportFile(file);
              return false;
            }}
            onRemove={() => setImportFile(null)}
            fileList={importFile ? [{ uid: '-1', name: importFile.name }] : []}
          >
            <Button icon={<UploadOutlined />}>Выбрать файл</Button>
          </Upload>

          {importFile && (
            <div style={{ color: '#52c41a' }}>
              Выбран файл: <b>{importFile.name}</b>
            </div>
          )}
        </Space>
      </Modal>
    </Space>
  );
}