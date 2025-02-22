![Setta Logo](images/setta-github-light.png#gh-light-mode-only)
![Setta Logo](images/setta-github-dark.png#gh-dark-mode-only)


<div align="center">
  
[![PyPI version](https://img.shields.io/pypi/v/setta?color=bright-green)](https://pypi.org/project/setta)
[![License](https://img.shields.io/pypi/l/setta?color=bright-green)](https://github.com/settadev/setta/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join-7389D8?logo=discord&logoColor=white)](https://discord.gg/MmHJz75bZ5)

</div>

## News

**February 21**: [v0.0.5](https://github.com/settadev/setta/releases/tag/v0.0.5)
- Mostly styling updates.

**February 20**: [v0.0.4](https://github.com/settadev/setta/releases/tag/v0.0.4)
- Improvements to subprocesses and param sweeps.

**February 18**: [v0.0.3](https://github.com/settadev/setta/releases/tag/v0.0.3)
- Big improvements to charts and in-memory functions.


## What does Setta do?

Setta is a general-purpose developer tool that streamlines Python coding, configuration, UI creation, and onboarding.

It enables you to:
- Skip the boilerplate parsers and frontend. 
- Effortlessly expose your Python functions as a flexible UI. 
- Configure, interact, and share with ease.

Here's a short intro video:

https://github.com/user-attachments/assets/0599b754-1fbc-470b-ad6f-ac44b01da761


## Examples

Trying out Setta is the best way to see what it can do, and we have a bunch of easy-to-run examples here: https://github.com/settadev/examples

Or click on one of the images below to go directly to that example:

<table>
  <tr>
    <td><a href="https://github.com/settadev/examples/tree/main/stream_diffusion_img_to_img"><img src="https://github.com/user-attachments/assets/2a063779-ed61-4103-90a5-bf127f3ea012" /></a></td>
    <td><a href="https://github.com/settadev/examples/tree/main/trl_language_model_finetuning"><img src="https://github.com/user-attachments/assets/96775341-4b6d-4d3c-8bc2-743eafce458a" /></a></td>
  </tr>
  <tr>
    <td><a href="https://github.com/settadev/examples/tree/main/transformers_trainer"><img src="https://github.com/user-attachments/assets/1f6554f8-8d49-4ba8-af48-f5dc6bc5d845" /></a></td>
    <td><a href="https://github.com/settadev/examples/tree/main/pytorch_metric_learning_trainer"><img src="https://github.com/user-attachments/assets/45ae2047-9dbd-4057-9191-9a3460357ccc" /></a></td>
  </tr>
</table>

We also have [tutorial videos](https://www.youtube.com/@settadev).

## Getting started

Run this command in your terminal:

```
pip install setta
```

Then go to your project folder and enter:

```
setta
```

The Setta UI will now be available in your web browser at http://127.0.0.1:8000/.

## Create and run your first Setta project

On the home page click `New Config`. This will load a brand new, empty project.

Right click to open the context menu, and click `Section` to create your first section. Double click on the section name, and rename it to `special_val`.

Type `math.sqrt` in the callable field, and press the tab key. An `x` parameter should appear in the parameters area. Enter `10` in the text field next to `x`.

Right click to open the context menu, and click `Python Code` to create a code block. Paste the following into this code block:

```python
$SETTA_GENERATED_PYTHON

print(special_val)
```

Click Run in the nav bar. A terminal will print and it should print `3.1622776601683795`.

Congratulations! You've successfully run your first Setta project!

## Documentation

Documentation is in progress: https://docs.setta.dev/


## Features

See our [Features](FEATURES.md) document for an overview of what Setta can do.


## Contributors

- [Kevin Musgrave](https://github.com/KevinMusgrave): co-creator & full-stack developer.
- [Jeff Musgrave](https://github.com/JeffMusgrave): co-creator, UI/UX developer, frontend developer, and designer.
