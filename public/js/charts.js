document.addEventListener('DOMContentLoaded', async () => {
    // Chart.js Global Configuration
    Chart.defaults.font.family = "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.font.size = window.innerWidth < 768 ? 10 : 12;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(47, 90, 52, 0.8)';
    Chart.defaults.plugins.legend.position = 'top';

    // Theme Colors
    const colors = {
        primary: '#2F5A34',     // Dark green
        secondary: '#8BC34A',   // Light green
        accent: '#4CAF50',      // Medium green
        warning: '#FFA000',     // Orange
        danger: '#D32F2F',      // Red
        background: 'rgba(139, 195, 74, 0.1)'
    };

    // Responsive font sizes
    const getFontSize = () => window.innerWidth < 768 ? 10 : 12;
    const getTitleSize = () => window.innerWidth < 768 ? 14 : 16;
    
    try {
        // Fetch data for the charts
        console.log('Fetching chart data...');
        const [salesData, inventoryData, deliveryData, forecastData] = await Promise.all([
            fetch('/api/sales').then(res => res.json()),
            fetch('/api/products').then(res => res.json()),
            fetch('/api/deliveries').then(res => res.json()),
            fetch('/api/forecasts').then(res => res.json())
        ]);

        // Extract the products data from the response
        const products = Array.isArray(inventoryData.data) ? inventoryData.data : inventoryData;
        console.log('Products for chart:', products);

        // Common chart options
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: getFontSize()
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: getFontSize()
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: getFontSize()
                        }
                    }
                }
            }
        };

        // Bar Chart: Inventory Status
        const inventoryChartCtx = document.getElementById('inventoryChart').getContext('2d');
        new Chart(inventoryChartCtx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.product_name),
                datasets: [{
                    label: 'Current Stock',
                    data: products.map(p => parseInt(p.quantity_in_stock)),
                    backgroundColor: colors.secondary,
                    borderRadius: 6,
                    borderColor: colors.primary,
                    borderWidth: 1
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        display: true,
                        text: 'Product Inventory Levels',
                        font: { 
                            size: getTitleSize(),
                            weight: 'bold'
                        },
                        color: colors.primary
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Stock: ${context.raw.toLocaleString()} units`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        title: { 
                            display: true,
                            text: 'Products',
                            color: colors.primary,
                            font: {
                                size: getFontSize()
                            }
                        },
                        ticks: { 
                            color: colors.primary,
                            autoSkip: false,
                            maxRotation: window.innerWidth < 768 ? 45 : 0,
                            minRotation: window.innerWidth < 768 ? 45 : 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(47, 90, 52, 0.1)' },
                        title: { 
                            display: true,
                            text: 'Quantity',
                            color: colors.primary,
                            font: {
                                size: getFontSize()
                            }
                        },
                        ticks: { 
                            color: colors.primary,
                            callback: (value) => value.toLocaleString()
                        }
                    }
                }
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                Chart.defaults.font.size = getFontSize();
                Chart.instances.forEach(chart => {
                    chart.options.plugins.title.font.size = getTitleSize();
                    chart.options.scales.x.ticks.maxRotation = window.innerWidth < 768 ? 45 : 0;
                    chart.update();
                });
            }, 250);
        });

        // Line Chart: Sales Trends
        const salesChartCtx = document.getElementById('salesChart').getContext('2d');
        new Chart(salesChartCtx, {
            type: 'line',
            data: {
                labels: salesData.map(s => {
                    const date = new Date(s.transaction_date);
                    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Sales Amount',
                    data: salesData.map(s => s.total_amount),
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: colors.accent
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Sales Trend',
                        font: { size: getTitleSize(), weight: 'bold', color: colors.primary }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Sales: ₱${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        title: { display: true, text: 'Date', color: colors.primary }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(47, 90, 52, 0.1)' },
                        title: { display: true, text: 'Amount (PHP)', color: colors.primary },
                        ticks: {
                            callback: (value) => `₱${value.toLocaleString()}`,
                            color: colors.primary
                        }
                    }
                }
            }
        });

        // Pie Chart: Delivery Status
        const deliveryChartCtx = document.getElementById('deliveryChart').getContext('2d');
        const deliveryCounts = {
            'Pending': 0,
            'In Transit': 0,
            'Delivered': 0
        };

        deliveryData.forEach(d => {
            deliveryCounts[d.delivery_status]++;
        });

        new Chart(deliveryChartCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(deliveryCounts),
                datasets: [{
                    data: Object.values(deliveryCounts),
                    backgroundColor: [
                        colors.danger,    // Red for Pending
                        colors.warning,   // Orange for In Transit
                        colors.accent     // Green for Delivered
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    title: {
                        display: true,
                        text: 'Delivery Status Distribution',
                        font: { size: getTitleSize(), weight: 'bold', color: colors.primary }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.primary
                        }
                    }
                }
            }
        });

        // Radar Chart: Growth Forecast
        const forecastChartCtx = document.getElementById('forecastChart')?.getContext('2d');
        if (forecastChartCtx && forecastData.length > 0) {
            let metrics = {};
            try {
                metrics = forecastData[0].report_data;
                console.log('Growth metrics:', metrics);
                
                // Find the maximum value to set the scale
                const maxValue = Math.ceil(Math.max(...Object.values(metrics)) / 10) * 10;
                
                new Chart(forecastChartCtx, {
                    type: 'radar',
                    data: {
                        labels: Object.keys(metrics),
                        datasets: [{
                            label: 'Growth Metrics (%)',
                            data: Object.values(metrics),
                            backgroundColor: 'rgba(47, 90, 52, 0.2)',
                            borderColor: 'rgba(47, 90, 52, 0.8)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(47, 90, 52, 1)',
                            pointRadius: 4
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Growth Metrics',
                                font: { size: getTitleSize(), weight: 'bold' }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${context.raw.toFixed(1)}%`;
                                    }
                                }
                            }
                        },
                        scales: {
                            r: {
                                beginAtZero: true,
                                min: 0,
                                max: maxValue,
                                ticks: {
                                    stepSize: maxValue / 5,
                                    callback: (value) => `${value}%`
                                },
                                pointLabels: {
                                    font: {
                                        size: getFontSize(),
                                        weight: 'bold'
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.error('Error creating forecast chart:', e);
                const container = forecastChartCtx.canvas.parentElement;
                container.innerHTML = '<div class="alert alert-warning">Unable to display forecast data. Please try again later.</div>';
            }
        } else {
            console.error('Forecast chart context not found or no forecast data available');
            if (forecastChartCtx) {
                const container = forecastChartCtx.canvas.parentElement;
                container.innerHTML = '<div class="alert alert-warning">No forecast data available</div>';
            }
        }

    } catch (error) {
        console.error('Error initializing charts:', error);
        // Add error handling UI feedback here
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="alert alert-danger">Error loading chart data. Please try refreshing the page.</div>';
        });
    }
});