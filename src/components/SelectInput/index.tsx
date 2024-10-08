import SearchSelectInput, { Props as SearchSelectInputProps } from '#components/SearchSelectInput';
import { rankedSearchOnList } from '#utils/common';

type Def = { containerClassName?: string, title: string };
type OptionKey = string | number;

type Props<
    OPTION_KEY extends OptionKey,
    NAME,
    // eslint-disable-next-line @typescript-eslint/ban-types
    OPTION extends object,
    RENDER_PROPS extends Def,
    OMISSION extends string,
> = SearchSelectInputProps<
    OPTION_KEY,
    NAME,
    OPTION,
    RENDER_PROPS,
    OMISSION | 'onSearchValueChange' | 'searchOptions' | 'onShowDropdownChange' | 'totalOptionsCount'
    | 'selectedOnTop'
>;

// eslint-disable-next-line @typescript-eslint/ban-types
function SelectInput<
    OPTION_KEY extends OptionKey,
    const NAME,
    OPTION extends object,
    RENDER_PROPS extends Def,
>(
    props: Props<OPTION_KEY, NAME, OPTION, RENDER_PROPS, never>,
) {
    const {
        name,
        options,
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        nonClearable,
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        onChange,
        ...otherProps
    } = props;

    // NOTE: this looks weird but we need to use typeguard to identify between
    // different union types (for onChange and nonClearable)
    // eslint-disable-next-line react/destructuring-assignment
    if (props.nonClearable) {
        return (
            <SearchSelectInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                // eslint-disable-next-line react/destructuring-assignment
                onChange={props.onChange}
                // eslint-disable-next-line react/destructuring-assignment
                nonClearable={props.nonClearable}
                name={name}
                options={options}
                sortFunction={rankedSearchOnList}
                searchOptions={options}
                selectedOnTop={false}
            />
        );
    }
    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            // eslint-disable-next-line react/destructuring-assignment
            onChange={props.onChange}
            // eslint-disable-next-line react/destructuring-assignment
            nonClearable={props.nonClearable}
            name={name}
            options={options}
            sortFunction={rankedSearchOnList}
            searchOptions={options}
            selectedOnTop={false}
        />
    );
}

export default SelectInput;
