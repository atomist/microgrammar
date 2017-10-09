# Maintaining State While Matching
While microgrammars themselves maintain and build up state while matching, the infrastructure can maintain state across the entire input (even when no match is in progress).

For example, this could be useful to:

- Disable certain matches in a particular context
- Stop parsing after a certain number of matches have been found

tbd