# Performance Configuration

CollabCanvas now supports configurable performance settings through environment variables. This allows you to easily test different performance profiles in production without code changes.

## Environment Variables

### Cursor Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CURSOR_THROTTLE_MS` | `16` | How often cursor updates are throttled (milliseconds) |
| `VITE_CURSOR_DEBOUNCE_MS` | `16` | Debounce delay after mouse stops moving (milliseconds) |

### Shape Updates

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SHAPE_RETRY_DELAY_MS` | `1000` | Delay between retry attempts for failed updates (milliseconds) |
| `VITE_SHAPE_MAX_RETRIES` | `3` | Maximum number of retry attempts |

### Presence System

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PRESENCE_UPDATE_INTERVAL_MS` | `30000` | How often to update user presence heartbeat (milliseconds) |
| `VITE_PRESENCE_CLEANUP_INTERVAL_MS` | `300000` | How often to clean up stale presence data (milliseconds) |

### Debugging

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_PERFORMANCE_LOGGING` | `false` | Enable detailed performance timing logs |

## Usage

1. Copy `env.example` to `.env.local`
2. Modify the values as needed
3. Restart the development server

## Performance Profiles

### High Performance (Low Latency)
```bash
VITE_CURSOR_THROTTLE_MS=8
VITE_CURSOR_DEBOUNCE_MS=8
VITE_SHAPE_RETRY_DELAY_MS=500
VITE_SHAPE_MAX_RETRIES=5
VITE_PRESENCE_UPDATE_INTERVAL_MS=15000
VITE_PRESENCE_CLEANUP_INTERVAL_MS=180000
VITE_ENABLE_PERFORMANCE_LOGGING=true
```

### Low Bandwidth (High Efficiency)
```bash
VITE_CURSOR_THROTTLE_MS=50
VITE_CURSOR_DEBOUNCE_MS=100
VITE_SHAPE_RETRY_DELAY_MS=2000
VITE_SHAPE_MAX_RETRIES=2
VITE_PRESENCE_UPDATE_INTERVAL_MS=60000
VITE_PRESENCE_CLEANUP_INTERVAL_MS=600000
VITE_ENABLE_PERFORMANCE_LOGGING=false
```

### Balanced (Default)
```bash
VITE_CURSOR_THROTTLE_MS=16
VITE_CURSOR_DEBOUNCE_MS=16
VITE_SHAPE_RETRY_DELAY_MS=1000
VITE_SHAPE_MAX_RETRIES=3
VITE_PRESENCE_UPDATE_INTERVAL_MS=30000
VITE_PRESENCE_CLEANUP_INTERVAL_MS=300000
VITE_ENABLE_PERFORMANCE_LOGGING=false
```

## Testing in Production

1. Set environment variables in your deployment platform
2. Deploy with different configurations
3. Monitor performance metrics
4. Adjust based on user experience and server load

## Monitoring

When `VITE_ENABLE_PERFORMANCE_LOGGING=true`, you'll see detailed timing information in the browser console:

```
🎯 Cursor update took 12.34ms
🔄 Shape update retry 1/3 in 1000ms
💓 Presence update took 45.67ms for user: abc123
```

This helps identify performance bottlenecks and optimize settings for your specific use case.
