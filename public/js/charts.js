document.addEventListener('DOMContentLoaded', async () => {
    try {
        // First check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js is not loaded');
        }

        // Check if canvas elements exist
        const canvasElements = {
            sales: document.getElementById('salesChart'),
            inventory: document.getElementById('inventoryChart'),
            delivery: document.getElementById('deliveryChart'),
            forecast: document.getElementById('forecastChart')
        };

        // Log canvas elements status
        Object.entries(canvasElements).forEach(([name, element]) => {
            console.log(`${name} canvas element:`, element ? 'Found' : 'Not found');
            if (element && !(element instanceof HTMLCanvasElement)) {
                console.error(`${name} element is not a canvas:`, element);
            }
        });

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
            }
        };

        console.log('Fetching chart data...');
        
        try {
            // Fetch data for charts with timeout and retry
            const timeout = 10000; // 10 seconds
            const maxRetries = 3;
            
            const fetchWithRetry = async (url, retries = 0) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                try {
                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log(`[${url}] Response:`, data);
                    
                    // Validate data structure
                    if (!data || (typeof data === 'object' && !data.success && !data.data)) {
                        throw new Error(`Invalid data format from ${url}`);
                    }
                    
                    return data;
                } catch (error) {
                    console.error(`[${url}] Fetch error (attempt ${retries + 1}):`, error);
                    
                    if (retries < maxRetries) {
                        console.log(`Retrying ${url}... (${retries + 1}/${maxRetries})`);
                        return fetchWithRetry(url, retries + 1);
                    }
                    throw error;
                }
            };

            // Fetch all data
            const [productsResponse, salesResponse, deliveriesResponse, forecastResponse] = await Promise.all([
                fetchWithRetry('/api/products'),
                fetchWithRetry('/api/sales'),
                fetchWithRetry('/api/deliveries'),
                fetchWithRetry('/api/forecasts')
            ]);

            // Create inventory chart
            if (canvasElements.inventory && productsResponse && productsResponse.success) {
                const products = productsResponse.data;
                
                if (!Array.isArray(products)) {
                    throw new Error('Products data is not an array');
                }
                
                console.log('Creating inventory chart with data:', products);
                
                if (products.length === 0) {
                    throw new Error('No product data available');
                }

                new Chart(canvasElements.inventory.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: products.map(p => p.product_name || 'Unknown'),
                        datasets: [{
                            label: 'Current Stock',
                            data: products.map(p => parseInt(p.quantity_in_stock) || 0),
                            backgroundColor: colors.secondary,
                            borderColor: colors.primary,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Product Inventory Levels',
                                font: { size: getTitleSize(), weight: 'bold' }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Quantity in Stock'
                                }
                            }
                        }
                    }
                });
                console.log('Inventory chart created successfully');
            }

            // Create other charts here...

        } catch (error) {
            console.error('Error fetching or processing data:', error);
            document.querySelectorAll('.chart-container').forEach(container => {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <h5>Error loading chart</h5>
                        <p>${error.message}</p>
                        <p>Time: ${new Date().toISOString()}</p>
                        <small>Check browser console for more details</small>
                    </div>
                `;
            });
        }

    } catch (error) {
        console.error('Chart initialization error:', error);
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Chart initialization failed</h5>
                    <p>${error.message}</p>
                    <p>Time: ${new Date().toISOString()}</p>
                </div>
            `;
        });
    }
});