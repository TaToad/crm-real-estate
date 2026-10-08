import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Empty } from 'antd';
import {
  DollarOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';

interface StageData {
  stage: string;
  label: string;
  count: number;
  amount: number;
}

interface ManagerData {
  name: string;
  total: number;
  count: number;
}

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

interface DashboardData {
  deals: {
    active_count: number;
    active_amount: number;
    won_count: number;
    won_amount: number;
    conversion_percent: number;
  };
  tasks: {
    open: number;
    overdue: number;
  };
  companies_count: number;
  contacts_count: number;
  active_leads_count: number;
  stages: StageData[];
  managers: ManagerData[];
  monthly: MonthlyData[];
}

const STAGE_COLORS: Record<string, string> = {
  first_contact: '#d9d9d9',
  needs: '#bae0ff',
  offer: '#91caff',
  negotiation: '#69b1ff',
  contract: '#ffd591',
  payment: '#ffc069',
  won: '#b7eb8f',
  lost: '#ffa39e',
};

const formatMoney = (v: number) =>
  v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>('/dashboard/')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin style={{ marginTop: 100 }} />;
  if (!data) return <Empty description="Нет данных" />;

  // Готовим данные для круговой диаграммы — только этапы со сделками
  const pieData = data.stages
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.label,
      value: s.count,
      color: STAGE_COLORS[s.stage] || '#d9d9d9',
    }));

  return (
    <Row gutter={[16, 16]}>
      {/* === Верхние карточки метрик === */}
      <Col span={6}>
        <Card>
          <Statistic
            title="Сделок в работе"
            value={data.deals.active_count}
            prefix={<RiseOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Сумма активных сделок"
            value={formatMoney(data.deals.active_amount)}
            suffix="₽"
            prefix={<DollarOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Компаний"
            value={data.companies_count}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Задач открыто"
            value={data.tasks.open}
            prefix={<CheckSquareOutlined />}
            valueStyle={data.tasks.overdue > 0 ? { color: '#cf1322' } : undefined}
          />
          {data.tasks.overdue > 0 && (
            <div style={{ color: '#cf1322', fontSize: 12 }}>
              просрочено: {data.tasks.overdue}
            </div>
          )}
        </Card>
      </Col>

      {/* === Вторая строка метрик === */}
      <Col span={8}>
        <Card title="Выиграно сделок">
          <Statistic
            value={data.deals.won_count}
            suffix={`на ${formatMoney(data.deals.won_amount)} ₽`}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Конверсия">
          <Statistic value={data.deals.conversion_percent} suffix="%" />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Активных лидов">
          <Statistic value={data.active_leads_count} />
        </Card>
      </Col>

      {/* === Круговая диаграмма по этапам === */}
      <Col span={12}>
        <Card title="Сделки по этапам воронки">
          {pieData.length === 0 ? (
            <Empty description="Нет сделок" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} сделок`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Col>

      {/* === Топ менеджеров === */}
      <Col span={12}>
        <Card title="Топ-10 менеджеров по выигранным сделкам">
          {data.managers.length === 0 ? (
            <Empty description="Нет выигранных сделок" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.managers}>
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => `${formatMoney(v)} ₽`}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="total" fill="#1677ff" name="Сумма" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Col>

      {/* === Динамика по месяцам === */}
      <Col span={24}>
        <Card title="Динамика выигранных сделок по месяцам">
          {data.monthly.length === 0 ? (
            <Empty description="Нет данных" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `${formatMoney(v)} ₽`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#52c41a"
                  strokeWidth={2}
                  name="Сумма"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1677ff"
                  strokeWidth={2}
                  name="Количество"
                  yAxisId={0}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Col>
    </Row>
  );
}