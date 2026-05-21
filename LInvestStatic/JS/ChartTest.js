import { CandlestickSeries, createChart } from 'lightweight-charts';

const chartOptions = { layout: {textcolor: 'white', background: { type: 'solid', color: 'black'}}};
const mainChart = createChart(document.getElementById('stockChart'), chartOptions);
const candlestickSeries = mainChart.addSeries(CandlestickSeries, {
    upColor: "#ff4d4f",
    downColor: "#4096ff",
    borderVisible: false,
    wickUpColor: "#ff4d4f",
    wickDownColor: "#4096ff"
})

candlestickSeries.setData([
    { time : '2026-05-21', open: 279500, high: 280000, low: 279500, close: 279500}
])

chartOptions.timeScale().fitContent();