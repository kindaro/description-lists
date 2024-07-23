# Description Lists for Obsidian

This is a plugin for Obsidian (<https://obsidian.md>). It renders description
lists in reading mode.

## what are description lists

Description lists are a feature of HTML. They were called _«definition lists»_
before but _«description list»_ is the current name. They are denoted like this:

``` markdown
tiger _(panthera tigris)_
: has striped fur that looks orange to humans but green to zebras
```

There can be one or more terms and one or more details in a description:

``` markdown
cat _(felis catus)_
tiger _(panthera tigris)_
: belongs to family _felidae_
: has soft paws
```

You can read about description lists in more detail [somewhere on the Internet][mdn], and you can read more about denotation of description lists in markdown [elsewhere on the Internet][pandoc].

[mdn]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
[pandoc]: https://pandoc.org/MANUAL.html#definition-lists

### description lists and Obsidian

Obsidian's markdown engine does not support description lists. This feature [has
been requested since forever][forum] but there is no indication so far that any
progress will  happen along official channels. We have to take care of the
matter ourselves.

[forum]: https://forum.obsidian.md/t/add-support-for-definition-lists/224

## how this plugin solves the problem

We take the rendered HTML and find all paragraphs in it that look like
description lists. We decide if a paragraph looks like a description list by
parsing its children nodes — if the parse succeeds, we have the descriptions at
hand. We then construct new description list HTML code for each paragraph and
swap it in.

### what we cannot do

Sadly, we cannot handle block elements like paragraphs and lists. This means
that we also cannot handle nested description lists. Since all these things are
defined in markdown by whitespace, and Obsidian strips whitespace, we do not
have this information.

## prior art

* Turns out [there is already a plugin][plugin] that attempts to do the
  same. Too bad I was not aware of its existence until after I wrote mine.

  Differences:

  - This other plugin takes a much simpler approach to the problem. The code is
    way shorter.
  - However, it does not handle inline markup as well as this one.
  - It does not seem to be able to handle multiple terms or details at the
    moment.
  - Also, this plugin has fancier style.

[plugin]: https://github.com/shammond42/definition-list

## how to use

- Clone this repository.
- Make sure your NodeJS is at least v16 (`node --version`).
- Run `yarn` to install dependencies.
- Run `yarn build` to build `main.js`.
- Run `yarn version patch`, `yarn version minor`or `yarn version major` to
  automatically update version everywhere it needs to be updated.
- Run `yarn typedoc` to generate automatic documentation.
- Run `format` to tidy up the whitespace.
- Run `lint` to make sure nothing is overly stupid.

## manually installing the plugin

- Run `yarn` and `yarn build` to build `main.js`.
  - Copy over `main.js`, `styles.css`, `manifest.json` to your vault
    `VaultFolder/.obsidian/plugins/description-lists/`.
