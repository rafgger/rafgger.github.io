import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Line } from '@antv/g2plot';
import _ from 'lodash';

// Define the TrendChart component
function TrendChart() {
  const chartNodeRef = useRef(null);
  const chartRef = useRef(null);
  const [tooltipItems, setTooltipItems] = useState([]);
  const [activeTooltipTitle, setActiveTooltipTitle] = useState(null);
  const [activeSeriesList, setActiveSeriesList] = useState([]);

  useEffect(() => {
    const chartDom = chartNodeRef.current;

    // Fetch data from the local JSON file
    fetch('data.json')
      .then((res) => res.json())
      .then((data) => {
        const line = new Line(chartDom, {
          data,
          autoFit: true,
          xField: 'Date',
          yField: 'value',
          seriesField: 'series',
          xAxis: {
            type: 'cat',
            label: {
              autoRotate: false,
              formatter: (v) => v.split('/').reverse().join('-'),
            },
          },
          yAxis: {
            grid: {
              line: {
                style: { lineWidth: 0.5 },
              },
            },
          },
          meta: {
            Date: { range: [0.04, 0.96] },
          },
          point: {
            shape: 'circle',
            size: 2,
            style: () => ({ fillOpacity: 0, stroke: 'transparent' }),
          },
          appendPadding: [0, 0, 0, 0],
          legend: false,
          smooth: true,
          lineStyle: { lineWidth: 1.5 },
          tooltip: { showMarkers: false, follow: false, position: 'top', customContent: () => null },
          theme: {
            geometries: {
              point: {
                circle: {
                  active: { style: { r: 4, fillOpacity: 1, stroke: '#000', lineWidth: 1 } },
                },
              },
            },
          },
          interactions: [{ type: 'marker-active' }, { type: 'brush' }],
        });

        line.render();
        chartRef.current = line;

        const lastData = _.last(data);
        const point = line.chart.getXY(lastData);
        line.chart.showTooltip(point);
        setActiveTooltipTitle(lastData.Date);
        setTooltipItems(data.filter((d) => d.Date === lastData.Date));

        line.on('plot:mouseleave', () => line.chart.hideTooltip());
        line.on('tooltip:change', (evt) => {
          const { title } = evt.data;
          setTooltipItems(data.filter((d) => d.Date === title));
          setActiveTooltipTitle(title);
        });
      });
  }, []);

  const changeActiveSeries = (activeSeries) => {
    const newList = activeSeriesList.includes(activeSeries)
      ? activeSeriesList.filter((s) => s !== activeSeries)
      : [...activeSeriesList, activeSeries];
    setActiveSeriesList(newList);

    const chart = chartRef.current.chart;
    if (chart) {
      chart.filter('series', (series) => !newList.includes(series));
      chart.render(true);
      chart.geometries
        .find((geom) => geom.type === 'point')
        .elements.forEach((ele) => {
          const { Date, series } = ele.getModel().data;
          if (Date === activeTooltipTitle && series === activeSeries) {
            ele.setState('active', true);
          }
        });
    }
  };

  return (
    <section className="wrapper trend-wrapper">
      <div className="chart-wrapper" ref={chartNodeRef} />
    </section>
  );
}

ReactDOM.render(<TrendChart />, document.getElementById('container'));
