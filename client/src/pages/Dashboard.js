import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    growthRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalUsers: 12543,
          totalRevenue: 89432.50,
          totalOrders: 1337,
          growthRate: 23.5
        });

        setRecentActivities([
          { id: 1, type: 'user', message: 'New user registration', time: '2 minutes ago' },
          { id: 2, type: 'order', message: 'Order #1234 completed', time: '5 minutes ago' },
          { id: 3, type: 'payment', message: 'Payment received $299.99', time: '10 minutes ago' },
          { id: 4, type: 'user', message: 'User profile updated', time: '15 minutes ago' },
          { id: 5, type: 'system', message: 'System backup completed', time: '1 hour ago' }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, trend, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
        {trend && (
          <span className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="activity-item">
      <div className={`activity-icon ${activity.type}`}>
        {activity.type === 'user' && '👤'}
        {activity.type === 'order' && '📦'}
        {activity.type === 'payment' && '💳'}
        {activity.type === 'system' && '⚙️'}
      </div>
      <div className="activity-content">
        <p>{activity.message}</p>
        <span className="activity-time">{activity.time}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.name || 'User'}!</p>
          </div>
          <div className="header-right">
            <button className="notification-btn">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <div className="user-menu">
              <img 
                src="https://via.placeholder.com/40x40" 
                alt="User Avatar" 
                className="user-avatar"
              />
              <button onClick={onLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <section className="stats-section">
              <div className="stats-grid">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers.toLocaleString()}
                  icon="👥"
                  trend={12.5}
                  color="blue"
                />
                <StatCard
                  title="Revenue"
                  value={`$${stats.totalRevenue.toLocaleString()}`}
                  icon="💰"
                  trend={stats.growthRate}
                  color="green"
                />
                <StatCard
                  title="Orders"
                  value={stats.totalOrders.toLocaleString()}
                  icon="📊"
                  trend={8.3}
                  color="purple"
                />
                <StatCard
                  title="Growth Rate"
                  value={`${stats.growthRate}%`}
                  icon="📈"
                  trend={stats.growthRate}
                  color="orange"
                />
              </div>
            </section>

            {/* Content Grid */}
            <section className="content-section">
              <div className="content-grid">
                {/* Chart Placeholder */}
                <div className="chart-card">
                  <h3>Revenue Trends</h3>
                  <div className="chart-placeholder">
                    <div className="chart-bars">
                      <div className="bar" style={{height: '60%'}}></div>
                      <div className="bar" style={{height: '80%'}}></div>
                      <div className="bar" style={{height: '45%'}}></div>
                      <div className="bar" style={{height: '90%'}}></div>
                      <div className="bar" style={{height: '70%'}}></div>
                      <div className="bar" style={{height: '95%'}}></div>
                      <div className="bar" style={{height: '65%'}}></div>
                    </div>
                    <p>Last 7 days</p>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="activities-card">
                  <h3>Recent Activities</h3>
                  <div className="activities-list">
                    {recentActivities.map(activity => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <h2>Analytics</h2>
            <p>Analytics content would go here...</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>Users Management</h2>
            <p>User management content would go here...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <h2>Settings</h2>
            <p>Settings content would go here...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;