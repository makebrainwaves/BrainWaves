from time import time, strftime, gmtime
import os
from collections import OrderedDict
from glob import glob

import numpy as np
import pandas as pd  # maybe we can remove this dependency
import seaborn as sns
from matplotlib import pyplot as plt

from mne import (Epochs, RawArray, concatenate_raws, concatenate_epochs,
                 create_info, find_events, read_epochs, set_eeg_reference)
from mne.channels import read_montage


plt.style.use(fivethirtyeight)
