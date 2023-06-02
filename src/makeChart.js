import Chart from "chart.js/auto";

export function makeChart(data, target){

  const ctx = document.getElementById(target).getContext("2d");
 const dlChart =  new Chart(ctx, {
      type: 'line', //bar, scatter, line
      options: {
        animation: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            enabled: true
          }
        },
          aspectRatio: 1,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Wavelenght (nm)',
                color: 'orange',
              },
              // max: 500,
              ticks: {
                callback: value => `${value} nm`
              }
            },
            y: {
              title: {
                display: true,
                text: 'Intensity'
              },
              // max: 500,
              ticks: {
                callback: value => `${value / 1000}k m`
              }
            }
          }
      },
      
      data: {
        labels: data.map(row => row.nm),
        datasets: [
          {
            label: 'Color Graph',
            data: data.map(row => row.intensity),
            fill: true,
            tension: 0.65,
            backgroundColor: (e)=>['lightblue'],
            borderColor: [
              'hsla(240, 99%, 53%, 0.2)',
              ],
            }
          ]
        }
      }
    );
    
    
    // for (i = 0; i < dlChart.data.datasets[0].data.length; i++) {
       console.log(dlChart.data.datasets[0].backgroundColor )
        // pointBackgroundColors.push("#90cd8a");

  
// }
  };

