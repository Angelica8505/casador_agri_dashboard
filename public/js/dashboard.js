document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Initialize dashboard stats
    const updateDashboardStats = async () => {
        try {
            // Fetch overview data
            const response = await fetch('/api/overview');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            const data = await response.json();

            // Update Total Sales with proper currency formatting
            const totalSalesElement = document.getElementById('totalSales');
            if (totalSalesElement) {
                const formattedSales = new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                }).format(data.totalSales || 0);
                totalSalesElement.textContent = formattedSales;
            }
            
            // Update Total Products with thousand separators
            const totalProductsElement = document.getElementById('totalProducts');
            if (totalProductsElement) {
                totalProductsElement.textContent = 
                    (data.totalProducts || 0).toLocaleString();
            }
            
            // Update Pending Deliveries with thousand separators
            const pendingDeliveriesElement = document.getElementById('pendingDeliveries');
            if (pendingDeliveriesElement) {
                pendingDeliveriesElement.textContent = 
                    (data.pendingDeliveries || 0).toLocaleString();
            }
            
            // Update Growth Rate with one decimal place
            const growthRateElement = document.getElementById('growthRate');
            if (growthRateElement) {
                growthRateElement.textContent = 
                    `${(data.growthRate || 0).toFixed(1)}%`;
            }

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Show error message to user
            const errorElements = document.querySelectorAll('.card-text');
            errorElements.forEach(element => {
                element.textContent = 'Error loading data';
                element.style.color = '#dc3545'; // Bootstrap danger color
            });
        }
    };

    // Update stats every 5 minutes
    updateDashboardStats();
    setInterval(updateDashboardStats, 5 * 60 * 1000);

    // Handle responsive behavior
    const handleResize = () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('active');
        } else {
            sidebar.classList.remove('active');
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
});