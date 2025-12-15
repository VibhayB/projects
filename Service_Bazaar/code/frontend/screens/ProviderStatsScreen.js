import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, Dimensions, Alert
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import config from '../utils/config';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ProviderStatsScreen = ({ route }) => {
  const { providerIds } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [viewType, setViewType] = useState('month');
  const [graphType, setGraphType] = useState('services');
  const [graphMode, setGraphMode] = useState('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRangeData, setTimeRangeData] = useState([]);

  useEffect(() => {
    if (providerIds && providerIds.length > 0) {
      fetchCompletedBookings();
    } else {
      setLoading(false);
      Alert.alert('Error', 'No provider IDs available');
    }
  }, [providerIds]);

  useEffect(() => {
    if (bookings.length > 0) {
      updateFilteredBookings();
      extractAvailableServices();
    }
  }, [bookings, selectedServices]);

  useEffect(() => {
    if (filteredBookings.length > 0) {
      prepareTimeRangeData();
    }
  }, [filteredBookings, viewType, currentDate, graphMode]);

  const fetchCompletedBookings = async () => {
    try {
      setLoading(true);
      const allBookings = [];

      for (const providerId of providerIds) {
        const response = await fetch(
          `${config.BASE_URL}/provider-completed-bookings/${providerId}`
        );
        if (response.ok) {
          const data = await response.json();
          allBookings.push(...data);
        }
      }

      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const updateFilteredBookings = () => {
    if (selectedServices.length === 0) {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => 
        selectedServices.includes(booking.service)
      );
      setFilteredBookings(filtered);
    }
  };

  const extractAvailableServices = () => {
    const services = [...new Set(bookings.map(booking => booking.service))];
    setAvailableServices(services);
    if (selectedServices.length === 0) {
      setSelectedServices(services);
    }
  };

  const prepareTimeRangeData = () => {
    let data = [];
    
    switch (viewType) {
      case 'week':
        data = prepareWeekData();
        break;
      case 'month':
        data = prepareMonthData();
        break;
    }
    
    setTimeRangeData(data);
  };

  const prepareWeekData = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      
      const isFuture = dayDate > today;

      const dayBookings = isFuture ? [] : filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === dayDate.toDateString();
      });

      return {
        label: day,
        services: dayBookings.length,
        revenue: dayBookings.reduce((sum, b) => sum + (b.cost || 0), 0),
        isFuture: isFuture,
        date: dayDate
      };
    });
  };

  const prepareMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayDate = new Date(year, month, day);
      
      const isFuture = dayDate > today;

      const dayBookings = isFuture ? [] : filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.getDate() === day && 
               bookingDate.getMonth() === month && 
               bookingDate.getFullYear() === year;
      });

      return {
        label: day.toString(),
        services: dayBookings.length,
        revenue: dayBookings.reduce((sum, b) => sum + (b.cost || 0), 0),
        isFuture: isFuture,
        date: dayDate
      };
    });
  };

  const navigateTime = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
    }
    
    const today = new Date();
    if (newDate > today) {
      return;
    }
    
    setCurrentDate(newDate);
  };

  const getChartData = () => {
    const pastData = timeRangeData.filter(item => !item.isFuture);
    const labels = pastData.map(item => item.label);
    
    let dailyData = [];
    let cumulativeData = [];
    let cumulativeAverageData = [];
    let runningAverageData = [];
    let totalValue = 0;
    let averageValue = 0;

    // Calculate data based on graph type
    switch (graphType) {
      case 'services':
        dailyData = pastData.map(item => item.services);
        cumulativeData = dailyData.map((_, index) => 
          dailyData.slice(0, index + 1).reduce((sum, val) => sum + val, 0)
        );
        totalValue = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1] : 0;
        averageValue = pastData.length > 0 ? totalValue / pastData.length : 0;
        break;
      case 'revenue':
        dailyData = pastData.map(item => item.revenue);
        cumulativeData = dailyData.map((_, index) => 
          dailyData.slice(0, index + 1).reduce((sum, val) => sum + val, 0)
        );
        totalValue = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1] : 0;
        averageValue = pastData.length > 0 ? totalValue / pastData.length : 0;
        break;
    }

    // Calculate running average for daily mode: average of PREVIOUS points only
    runningAverageData = dailyData.map((value, index) => {
      if (index === 0) {
        return 0;
      }
      const previousValues = dailyData.slice(0, index);
      const sumPrevious = previousValues.reduce((sum, val) => sum + val, 0);
      return sumPrevious / index;
    });

    // Calculate cumulative average: sum of values of all points before the previous point + (sum of values of all points before current one / number of points before current one)
    cumulativeAverageData = cumulativeData.map((value, index) => {
      if (index === 0) {
        return 0;
      }
      if (index === 1) {
        const firstPoint = cumulativeData[0];
        return 0 + (firstPoint / 1);
      }
      
      const pointsBeforePrevious = cumulativeData.slice(0, index - 1);
      const sumBeforePrevious = pointsBeforePrevious.reduce((sum, val) => sum + val, 0);
      
      const pointsBeforeCurrent = cumulativeData.slice(0, index);
      const sumBeforeCurrent = pointsBeforeCurrent.reduce((sum, val) => sum + val, 0);
      const averageBeforeCurrent = sumBeforeCurrent / index;
      
      return sumBeforePrevious + averageBeforeCurrent;
    });

    // Use cumulative or daily data based on mode for main line
    const mainData = graphMode === 'cumulative' ? cumulativeData : dailyData;
    
    // Use appropriate average data based on mode
    const averageLineData = graphMode === 'cumulative' ? cumulativeAverageData : runningAverageData;

    const validMainData = mainData.map(val => isNaN(val) ? 0 : val);
    const validAverageData = averageLineData.map(val => isNaN(val) ? 0 : val);

    const datasets = [
      {
        data: validMainData,
        color: (opacity = 1) => {
          switch (graphType) {
            case 'services':
              return `rgba(76, 175, 80, ${opacity})`;
            case 'revenue':
              return `rgba(255, 152, 0, ${opacity})`;
            default:
              return `rgba(0, 0, 0, ${opacity})`;
          }
        },
        strokeWidth: 3,
      }
    ];

    datasets.push({
      data: validAverageData,
      color: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
      strokeWidth: 2,
      strokeDashArray: [5, 5],
    });

    return {
      labels,
      datasets,
      totalValue,
      averageValue,
    };
  };

  const getCurrentStats = () => {
    return getChartData();
  };

  const getGraphTitle = () => {
    switch (graphType) {
      case 'services':
        return 'Services';
      case 'revenue':
        return 'Revenue';
      default:
        return 'Statistics';
    }
  };

  const getValueDisplay = () => {
    const stats = getCurrentStats();
    
    switch (graphType) {
      case 'services':
        return `${Math.round(stats.totalValue)}`;
      case 'revenue':
        return `₹${Math.round(stats.totalValue)}`;
      default:
        return Math.round(stats.totalValue);
    }
  };

  const getAverageDisplay = () => {
    const stats = getCurrentStats();
    
    switch (graphType) {
      case 'services':
        return `${Math.round(stats.averageValue)}`;
      case 'revenue':
        return `₹${Math.round(stats.averageValue)}`;
      default:
        return Math.round(stats.averageValue);
    }
  };

  const getDateRangeText = () => {
    const today = new Date();
    
    if (viewType === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekEnd > today) {
        weekEnd.setTime(today.getTime());
      }
      
      return `${weekStart.getDate()} ${weekStart.toLocaleDateString('en-US', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('en-US', { month: 'short' })} ${weekEnd.getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForLabels: {
      fontSize: 10,
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
    formatYLabel: (value) => {
      const num = parseFloat(value);
      return num.toFixed(2);
    },
  };

  const getFilteredLabels = () => {
    const labels = timeRangeData.filter(item => !item.isFuture).map(item => item.label);
    const step = Math.ceil(labels.length / 8);
    return labels.map((label, index) => (index % step === 0 ? label : ''));
  };

  const canNavigateForward = () => {
    const today = new Date();
    const testDate = new Date(currentDate);
    
    if (viewType === 'week') {
      testDate.setDate(testDate.getDate() + 7);
    } else {
      testDate.setMonth(testDate.getMonth() + 1);
    }
    
    return testDate <= today;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Service Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableServices.map(service => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.serviceChip,
                  selectedServices.includes(service) && styles.serviceChipSelected
                ]}
                onPress={() => {
                  if (selectedServices.includes(service)) {
                    if (selectedServices.length > 1) {
                      setSelectedServices(selectedServices.filter(s => s !== service));
                    }
                  } else {
                    setSelectedServices([...selectedServices, service]);
                  }
                }}
              >
                <Text style={[
                  styles.serviceChipText,
                  selectedServices.includes(service) && styles.serviceChipTextSelected
                ]}>
                  {service}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Analytics Type Ribbon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics Type</Text>
          <View style={styles.analyticsRibbon}>
            <TouchableOpacity
              style={[
                styles.analyticsButton,
                graphType === 'services' && styles.analyticsButtonActive
              ]}
              onPress={() => setGraphType('services')}
            >
              <Text style={[
                styles.analyticsButtonText,
                graphType === 'services' && styles.analyticsButtonTextActive
              ]}>
                Services Done
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.analyticsButton,
                graphType === 'revenue' && styles.analyticsButtonActive
              ]}
              onPress={() => setGraphType('revenue')}
            >
              <Text style={[
                styles.analyticsButtonText,
                graphType === 'revenue' && styles.analyticsButtonTextActive
              ]}>
                Revenue
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Display */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total {getGraphTitle()}</Text>
            <Text style={styles.statValue}>{getValueDisplay()}</Text>
            <Text style={styles.statPeriod}>this {viewType}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Average {getGraphTitle()}</Text>
            <Text style={styles.statValue}>{getAverageDisplay()}</Text>
            <Text style={styles.statPeriod}>per day</Text>
          </View>
        </View>

        {/* Controls Card - Combined Week/Month and Graph Mode */}
        <View style={styles.section}>
          <View style={styles.controlsRow}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Time Range</Text>
              <View style={styles.selector}>
                {['week', 'month'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.selectorButton,
                      viewType === type && styles.selectorButtonActive
                    ]}
                    onPress={() => setViewType(type)}
                  >
                    <Text style={[
                      styles.selectorButtonText,
                      viewType === type && styles.selectorButtonTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Graph Mode</Text>
              <View style={styles.selector}>
                {['daily', 'cumulative'].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.selectorButton,
                      graphMode === mode && styles.selectorButtonActive
                    ]}
                    onPress={() => setGraphMode(mode)}
                  >
                    <Text style={[
                      styles.selectorButtonText,
                      graphMode === mode && styles.selectorButtonTextActive
                    ]}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Time Navigation */}
          <View style={styles.timeNavigation}>
            <TouchableOpacity 
              onPress={() => navigateTime(-1)} 
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <Text style={styles.dateRangeText}>
              {getDateRangeText()}
            </Text>

            <TouchableOpacity 
              onPress={() => navigateTime(1)} 
              style={styles.navButton}
              disabled={!canNavigateForward()}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={canNavigateForward() ? "#007AFF" : "#ccc"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {timeRangeData.length > 0 && timeRangeData.filter(item => !item.isFuture).length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>
              {graphMode === 'cumulative' ? 'Cumulative ' : 'Daily '}{getGraphTitle()} Trend
            </Text>
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  ...getChartData(),
                  labels: getFilteredLabels()
                }}
                width={width - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                fromZero={true}
                segments={5}
                yAxisInterval={1}
              />
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { 
                    backgroundColor: graphType === 'services' ? '#4CAF50' : '#FF9800' 
                  }]} />
                  <Text style={styles.legendText}>
                    {graphMode === 'cumulative' ? 'Cumulative ' : 'Daily '}{getGraphTitle()}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#808080' }]} />
                  <Text style={styles.legendText}>
                    {graphMode === 'cumulative' ? 'Cumulative Average' : 'Running Average'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  serviceChipSelected: {
    backgroundColor: '#007AFF',
  },
  serviceChipText: {
    color: '#666',
    fontWeight: '500',
  },
  serviceChipTextSelected: {
    color: 'white',
  },
  // Analytics Ribbon
  analyticsRibbon: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  analyticsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  analyticsButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  analyticsButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  analyticsButtonTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  // Controls
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  controlLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  selector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectorButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectorButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 12,
  },
  selectorButtonTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  // Time Navigation
  timeNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    padding: 8,
  },
  dateRangeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statPeriod: {
    fontSize: 12,
    color: '#999',
  },
  // Chart
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ProviderStatsScreen;