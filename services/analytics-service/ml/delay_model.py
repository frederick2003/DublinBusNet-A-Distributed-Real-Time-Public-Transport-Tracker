import numpy as np

def predict_delay(avg_delay, traffic_factor):
    # simple baseline tool based on features that will be replaced by more complex models 
    return round(avg_delay * traffic_factor, 2)
