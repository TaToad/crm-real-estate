import { Layout as AntLayout, Menu, Button, Space } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FunnelPlotOutlined,
  CheckSquareOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import GlobalSearch from './GlobalSearch';

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin =
    user?.role === 'admin' || (user as any)?.is_superuser;

  const items = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Дашборд</Link> },
    { key: '/companies', icon: <TeamOutlined />, label: <Link to="/companies">Клиенты</Link> },
    { key: '/leads', icon: <BulbOutlined />, label: <Link to="/leads">Лиды</Link> },
    { key: '/deals', icon: <FunnelPlotOutlined />, label: <Link to="/deals">Воронка</Link> },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: <Link to="/tasks">Задачи</Link> },
    ...(isAdmin
      ? [{ key: '/users', icon: <UserOutlined />, label: <Link to="/users">Пользователи</Link> }]
      : []),
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div style={{ padding: 16, color: 'white', fontSize: 16, fontWeight: 600 }}>
          CRM Недвижимость
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
          }}
        >
          <GlobalSearch />
          <Space>
            <span>{user?.username}</span>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Выйти
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}