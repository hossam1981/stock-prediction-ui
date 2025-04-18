import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Paper, Typography, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, Grid
} from '@mui/material';

function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tomorrowPrediction, setTomorrowPrediction] = useState(null);

  useEffect(() => {
    // Fetch available stocks when component mounts
    axios.get('http://localhost:5000/api/available-stocks')
      .then(response => setStocks(response.data))
      .catch(error => setError('Failed to fetch available stocks'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/predict', {
        tickers: selectedStocks,
        startDate,
        endDate
      });
      setResults(response.data.results);
    } catch (err) {
      setError('Failed to get predictions');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictTomorrow = async (ticker) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/predict-tomorrow', {
        ticker
      });
      
      if (response.data.success) {
        setTomorrowPrediction(response.data.prediction);
      } else {
        setError(response.data.error || 'Failed to get prediction');
      }
    } catch (err) {
      setError('Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (e) => {
    setSelectedStocks([e.target.value]);
    setResults(null);
    setTomorrowPrediction(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Stock Price Prediction
        </Typography>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Stock</InputLabel>
            <Select
              value={selectedStocks[0] || ''}
              onChange={handleStockChange}
              label="Select Stock"
            >
              {stocks.map((stock) => (
                <MenuItem key={stock} value={stock}>
                  {stock}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ mr: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ mr: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <Button 
            variant="contained" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Predict'}
          </Button>
        </form>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {results && (
          <>
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
              Results
            </Typography>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Data Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(results).map(([ticker, data]) => (
                  <TableRow key={ticker}>
                    <TableCell>{ticker}</TableCell>
                    <TableCell>{(data.accuracy * 100).toFixed(2)}%</TableCell>
                    <TableCell>{data.data_points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        <Button 
          variant="contained" 
          onClick={() => handlePredictTomorrow(selectedStocks[0])}
          disabled={loading || !selectedStocks.length}
          sx={{ mt: 2, ml: 2 }}
        >
          Predict Tomorrow
        </Button>

        {tomorrowPrediction && (
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Tomorrow's Prediction for {tomorrowPrediction.ticker}
            </Typography>
            <Typography variant="h6" color={tomorrowPrediction.prediction === 'Up' ? 'success.main' : 'error.main'}>
              Direction: <strong>{tomorrowPrediction.prediction}</strong>
            </Typography>
            <Typography variant="body1">
              Confidence: {(tomorrowPrediction.confidence * 100).toFixed(2)}%
            </Typography>
            <Typography variant="body1">
              Last Close: ${tomorrowPrediction.last_close.toFixed(2)}
            </Typography>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Technical Signals</Typography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Paper elevation={1} sx={{ p: 1 }}>
                  <Typography variant="subtitle2">RSI</Typography>
                  <Typography>{tomorrowPrediction.technical_signals.RSI}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={1} sx={{ p: 1 }}>
                  <Typography variant="subtitle2">MACD</Typography>
                  <Typography>{tomorrowPrediction.technical_signals.MACD}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={1} sx={{ p: 1 }}>
                  <Typography variant="subtitle2">Bollinger</Typography>
                  <Typography>{tomorrowPrediction.technical_signals.Bollinger}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={1} sx={{ p: 1 }}>
                  <Typography variant="subtitle2">Volume</Typography>
                  <Typography>{tomorrowPrediction.technical_signals.Volume}</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Top Indicators</Typography>
            {Object.entries(tomorrowPrediction.top_indicators).map(([indicator, importance]) => (
              <Typography key={indicator} variant="body2">
                {indicator}: {(importance * 100).toFixed(1)}% importance
              </Typography>
            ))}
            
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Based on data up to {new Date(tomorrowPrediction.date).toLocaleDateString()}
            </Typography>
          </Paper>
        )}
      </Paper>
    </Container>
  );
}

export default App;
