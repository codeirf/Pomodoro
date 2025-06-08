"""
Minimalist Pomodoro Timer Flask Application
A clean, elegant Pomodoro timer with three modes: Pomodoro (25min), Short Break (5min), Long Break (15min)
"""

from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'pomodoro-timer-secret-key'

# Timer configurations in seconds
TIMER_CONFIGS = {
    'pomodoro': 25 * 60,    # 25 minutes
    'short_break': 5 * 60,  # 5 minutes
    'long_break': 15 * 60   # 15 minutes
}

@app.route('/')
def index():
    """Serve the main Pomodoro timer page"""
    return render_template('index.html')

@app.route('/api/timer-config')
def get_timer_config():
    """API endpoint to get timer configurations"""
    return jsonify(TIMER_CONFIGS)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Pomodoro Timer is running'})

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return render_template('index.html'), 404

if __name__ == '__main__':
    # Ensure static and template directories exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
