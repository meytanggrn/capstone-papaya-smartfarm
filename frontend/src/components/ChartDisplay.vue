<template>
    <div class="chart-container">
        <canvas ref="myChart"></canvas>
    </div>
</template>

<script>
import Chart from 'chart.js/auto';
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';

export default {
    name: 'ChartDisplay',
    props: {
        chartData: {
            type: Object,
            required: true,
        },
        chartType: {
            type: String,
            default: 'line',
        },
    },
    setup(props) {
        const myChart = ref(null); 
        let chartInstance = null; 

        const renderChart = () => {
            if (!props.chartData || !props.chartData.labels || !props.chartData.datasets) {
                console.warn('Chart data is incomplete or empty.');
                if (chartInstance) {
                    chartInstance.destroy();
                    chartInstance = null;
                }
                return;
            }

            if (chartInstance) {
                chartInstance.destroy(); 
            }

            const ctx = myChart.value.getContext('2d');

            const gradientStartColorForCahaya = '#CFC33F'; // Kuning dari Figma
            const gradientEndColorForCahaya = '#4A7374';   // Hijau dari Figma

            const lineGradientCahaya = ctx.createLinearGradient(0, 0, 0, myChart.value.height);
            lineGradientCahaya.addColorStop(0, gradientStartColorForCahaya);
            lineGradientCahaya.addColorStop(1, gradientEndColorForCahaya);

            const datasetsToRender = props.chartData.datasets.map(dataset => {
                let finalBorderColor = dataset.borderColor;
                let finalBackgroundColor = 'rgba(0,0,0,0)'; 

                if (dataset.borderColor === 'gradient-cahaya') {
                    finalBorderColor = lineGradientCahaya; // Terapkan objek gradient
                }

                return {
                    ...dataset,
                    borderColor: finalBorderColor,
                    backgroundColor: finalBackgroundColor,
                    tension: 0.4, 
                    fill: false,
                };
            });

            chartInstance = new Chart(ctx, {
                type: props.chartType,
                data: {
                    labels: props.chartData.labels,
                    datasets: datasetsToRender, // Gunakan datasets yang sudah dimodifikasi
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: props.chartData.datasets.length > 1,
                            position: 'top',
                        },
                        title: {
                            display: false,
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                        },
                        y: {
                            beginAtZero: true,
                        }
                    }
                },
            });
        };

        onMounted(() => {
            renderChart();
        });

        watch(() => props.chartData, (newVal, oldVal) => {
            renderChart();
        }, { deep: true });

        watch(() => props.chartType, (newVal, oldVal) => {
            renderChart();
        });

        onBeforeUnmount(() => {
            if (chartInstance) {
                chartInstance.destroy();
            }
        });

        return {
            myChart,
        };
    },
};
</script>

<style scoped>
.chart-container {
    position: relative;
    height: 400px;
    width: 100%;
}
</style>