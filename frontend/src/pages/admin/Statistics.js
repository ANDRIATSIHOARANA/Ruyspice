import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');
  
  const loadStatistics = useCallback(async () => {
    try {
      const response = await adminService.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const appointmentsData = {
    labels: stats?.rendezVousParMois?.map(item => item.mois) || [],
    datasets: [
      {
        label: 'Nombre de rendez-vous',
        data: stats?.rendezVousParMois?.map(item => item.nombre) || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const confirmationRateData = {
    labels: ['Confirmés', 'Annulés'],
    datasets: [
      {
        data: [
          stats?.tauxRendezVousConfirme || 0,
          100 - (stats?.tauxRendezVousConfirme || 0)
        ],
        backgroundColor: ['#4CAF50', '#f44336']
      }
    ]
  };

  return (
    <div className="statistics-container">
      <div className="controls">
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="period-select"
        >
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Rendez-vous totaux</h3>
          <p className="stat-number">{stats?.nombreRendezVous || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Taux de confirmation</h3>
          <p className="stat-number">{stats?.tauxRendezVousConfirme || 0}%</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart">
          <h3>Évolution des rendez-vous</h3>
          <Line data={appointmentsData} />
        </div>
        <div className="chart">
          <h3>Taux de confirmation</h3>
          <Bar data={confirmationRateData} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;