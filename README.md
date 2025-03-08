![Setta Logo](images/setta-github-light.png#gh-light-mode-only)
![Setta Logo](images/setta-github-dark.png#gh-dark-mode-only)


<div align="center">
  
[![PyPI version](https://img.shields.io/pypi/v/setta?color=bright-green)](https://pypi.org/project/setta)
[![License](https://img.shields.io/pypi/l/setta?color=bright-green)](https://github.com/settadev/setta/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join-7389D8?logo=discord&logoColor=white)](https://discord.gg/MmHJz75bZ5)

</div>

## News

**March 7**: [v0.0.15](https://github.com/settadev/setta/releases/tag/v0.0.15)
- Improved context menu organization.
- Added ability to change size of artifacts while preserving aspect ratio.
- Added Stop button for stopping subprocesses.

**March 5**: [v0.0.14](https://github.com/settadev/setta/releases/tag/v0.0.14)
- Allow access to individual layers of Drawing sections, as well as the combined output.
- Added button + shortcut for sending current full project state to in-memory functions.

**March 4**: [v0.0.13](https://github.com/settadev/setta/releases/tag/v0.0.13)
- Updated frontend javascript dependencies.


## What does Setta do?

Setta is a general-purpose developer tool that streamlines Python coding, configuration, UI creation, and onboarding.

It enables you to:
- Skip the boilerplate parsers and frontend. 
- Effortlessly expose your Python functions as a flexible UI. 
- Configure, interact, and share with ease.

So whether you are fine tuning large AI models, or writing a small Python script, Setta can turn it into a useable interface. No special integrations required!

Here's a short intro video:

https://github.com/user-attachments/assets/0599b754-1fbc-470b-ad6f-ac44b01da761


## Examples

Trying out Setta is the best way to see what it can do, and we have a bunch of easy-to-run examples here: https://github.com/settadev/examples

Or click on one of the images below to go directly to that example:

<table>
  <tr>
    <td><a href="https://github.com/settadev/examples/tree/main/stream_diffusion_img_to_img"><img src="https://github.com/user-attachments/assets/2a063779-ed61-4103-90a5-bf127f3ea012" /></a></td>
    <td><a href="https://github.com/settadev/examples/tree/main/trl_language_model_finetuning"><img src="https://github.com/user-attachments/assets/96775341-4b6d-4d3c-8bc2-743eafce458a" /></a></td>
    <td><a href="https://github.com/settadev/examples/tree/main/bfl_flux_fill"><img src="https://github.com/user-attachments/assets/5c0ed2f1-cfa7-46aa-a5ce-6f5d93fa414b" /></a></td>
    
    
  </tr>
  <tr>
    <td><a href="https://github.com/settadev/examples/tree/main/groq_api_chat"><img src="https://github.com/user-attachments/assets/0d8ff9c1-2557-4549-a816-3c6693430d98" /></a></td>
    <td><a href="https://github.com/settadev/examples/tree/main/transformers_trainer"><img src="https://github.com/user-attachments/assets/1f6554f8-8d49-4ba8-af48-f5dc6bc5d845" /></a></td>
    <td><a href="https://github.com/settadev/examples/tree/main/pytorch_metric_learning_trainer"><img src="https://github.com/user-attachments/assets/45ae2047-9dbd-4057-9191-9a3460357ccc" /></a></td>
  </tr>
</table>

We also have [tutorial videos](https://www.youtube.com/@settadev).

## Getting started

Activate your Python environment, and run:

```
pip install setta
```

Let's say you've created a new, empty git repo in a folder called `my_project`.

Move into that folder and run:

```
setta
```

The Setta UI will now be available in your web browser at http://127.0.0.1:8000/.

You'll also notice that Setta has created a few files. Here's what the structure of your `my_project` folder will look like: 

```
my_project/
├── setta_files/
│   ├── setta.db
│   ├── setta-settings.json
│   ├── setta-meta-settings.json
│   └── code/
│       └── temp_folder/
```

### Create and run your first Setta project

On the home page click `New Config`. This will load a brand new, empty project. 

<p align="center">
  <img src="https://github.com/user-attachments/assets/674c0aa2-bfa0-4c40-91cd-957cbdda0aa6" width="75%" alt="first_setta_project_1"/>
</p>

Right click to open the context menu, and click `Section` to create your first section. 

<p align="center">
  <img src="https://github.com/user-attachments/assets/74f7c74d-2833-45e3-ad11-2a203cfd360d" width="75%" alt="first_setta_project_2"/>
</p>

Double click on the section name, and rename it to `special_val`. Type `math.sqrt` in the callable field, and press the tab key. An `x` parameter should appear in the parameters area. Enter `10` in the text field next to `x`. 

<p align="center">
  <img src="https://github.com/user-attachments/assets/7f5b9781-9229-43aa-86a1-7675a699a6d5" width="75%" alt="first_setta_project_3"/>
</p>

Right click to open the context menu, and click `Python Code` to create a code block. 

<p align="center">
  <img src="https://github.com/user-attachments/assets/87cdffa8-5844-4530-a549-0dfc1baedfe7" width="75%" alt="first_setta_project_4"/>
</p>

Paste the following into this code block:

```python
$SETTA_GENERATED_PYTHON

print(special_val)
```

Click Run in the nav bar. A terminal will appear and it should print 3.1622776601683795.

<p align="center">
  <img src="https://github.com/user-attachments/assets/3a621fc4-fe07-45d4-a7ca-51b5271318d5" width="75%" alt="first_setta_project_5"/>
</p>

Congratulations! You've successfully run your first Setta project!

### What happens under the hood

When you click the Run button,  Setta replaces `$SETTA_GENERATED_PYTHON` with:

```python
import math

x = 10
special_val = math.sqrt(x)
```

Notice how it:
- Imports the Python `math` library.
- Converts your `special_val` section into a variable, equal to `math.sqrt(10)`.


## Documentation

Documentation is in progress: https://docs.setta.dev/


## Features

See our [Features](FEATURES.md) document for an overview of what Setta can do.


## Contributors

- [Kevin Musgrave](https://github.com/KevinMusgrave): co-creator & full-stack developer.
- [Jeff Musgrave](https://github.com/JeffMusgrave): co-creator, UI/UX developer, frontend developer, and designer.
